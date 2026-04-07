-- ─── Extensions ──────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─── Enums (safe to re-run) ───────────────────────────────────────────────────
do $$ begin
  create type cadence_type as enum ('weekly', 'biweekly', 'monthly');
exception when duplicate_object then null; end $$;

do $$ begin
  create type tier_type as enum ('free', 'paid');
exception when duplicate_object then null; end $$;

do $$ begin
  create type membership_role as enum ('eic', 'contributor');
exception when duplicate_object then null; end $$;

do $$ begin
  create type membership_status as enum ('invited', 'active');
exception when duplicate_object then null; end $$;

do $$ begin
  create type extraction_status as enum ('pending', 'success', 'paywalled', 'failed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type edition_status as enum ('draft', 'published');
exception when duplicate_object then null; end $$;

-- ─── Tables ───────────────────────────────────────────────────────────────────

create table if not exists public.users (
  id             uuid primary key references auth.users(id) on delete cascade,
  email          text not null unique,
  phone          text,
  display_name   text,
  avatar_initial text,
  created_at     timestamptz not null default now()
);

create table if not exists public.papers (
  id               uuid primary key default uuid_generate_v4(),
  slug             text not null unique,
  name             text not null,
  masthead_tagline text,
  created_by       uuid not null references public.users(id) on delete restrict,
  cadence          cadence_type not null default 'weekly',
  publish_day      int not null default 0 check (publish_day between 0 and 6),
  publish_time     time not null default '09:00',
  timezone         text not null default 'America/New_York',
  tier             tier_type not null default 'free',
  created_at       timestamptz not null default now()
);

create table if not exists public.memberships (
  id         uuid primary key default uuid_generate_v4(),
  paper_id   uuid not null references public.papers(id) on delete cascade,
  user_id    uuid not null references public.users(id) on delete cascade,
  role       membership_role not null,
  status     membership_status not null default 'invited',
  invited_at timestamptz not null default now(),
  joined_at  timestamptz,
  unique(paper_id, user_id)
);

create table if not exists public.invites (
  id         uuid primary key default uuid_generate_v4(),
  paper_id   uuid not null references public.papers(id) on delete cascade,
  email      text not null,
  token      text not null unique,
  claimed_by uuid references public.users(id) on delete set null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists public.editions (
  id             uuid primary key default uuid_generate_v4(),
  paper_id       uuid not null references public.papers(id) on delete cascade,
  edition_number int not null,
  publish_at     timestamptz,
  status         edition_status not null default 'draft',
  ai_sections    jsonb,
  created_at     timestamptz not null default now(),
  unique(paper_id, edition_number)
);

create table if not exists public.submissions (
  id                uuid primary key default uuid_generate_v4(),
  paper_id          uuid not null references public.papers(id) on delete cascade,
  user_id           uuid not null references public.users(id) on delete cascade,
  edition_id        uuid references public.editions(id) on delete set null,
  url               text not null,
  note              text check (char_length(note) <= 140),
  og_title          text,
  og_description    text,
  og_image          text,
  og_site_name      text,
  extracted_text    text,
  extraction_status extraction_status not null default 'pending',
  submitted_at      timestamptz not null default now()
);

-- ─── Indexes ─────────────────────────────────────────────────────────────────
create index if not exists idx_memberships_paper_id   on public.memberships(paper_id);
create index if not exists idx_memberships_user_id    on public.memberships(user_id);
create index if not exists idx_submissions_paper_id   on public.submissions(paper_id);
create index if not exists idx_submissions_edition_id on public.submissions(edition_id);
create index if not exists idx_editions_paper_id      on public.editions(paper_id);
create index if not exists idx_invites_token          on public.invites(token);

-- ─── Trigger: auto-populate users on sign-up ─────────────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.users(id, email, display_name, avatar_initial)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', null),
    upper(left(coalesce(new.raw_user_meta_data->>'display_name', new.email), 1))
  )
  on conflict (id) do update
    set display_name   = coalesce(excluded.display_name,   public.users.display_name),
        avatar_initial = coalesce(excluded.avatar_initial, public.users.avatar_initial);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── Row Level Security ───────────────────────────────────────────────────────
alter table public.users       enable row level security;
alter table public.papers      enable row level security;
alter table public.memberships enable row level security;
alter table public.invites     enable row level security;
alter table public.submissions enable row level security;
alter table public.editions    enable row level security;

-- ─── RLS helper functions (security definer = bypasses RLS, avoids recursion) ─
create or replace function public.is_paper_member(p_paper_id uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.memberships
    where paper_id = p_paper_id
      and user_id  = auth.uid()
      and status   = 'active'
  );
$$;

create or replace function public.is_paper_eic(p_paper_id uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.memberships
    where paper_id = p_paper_id
      and user_id  = auth.uid()
      and role     = 'eic'
      and status   = 'active'
  );
$$;

-- ─── Policies: users ─────────────────────────────────────────────────────────
drop policy if exists "Users can view own profile"   on public.users;
drop policy if exists "Users can view profiles"      on public.users;
drop policy if exists "Users can update own profile" on public.users;
drop policy if exists "Users can insert own profile" on public.users;

create policy "Users can view profiles"
  on public.users for select using (auth.uid() is not null);
create policy "Users can update own profile"
  on public.users for update using (auth.uid() = id);
create policy "Users can insert own profile"
  on public.users for insert with check (auth.uid() = id);

-- ─── Policies: papers ────────────────────────────────────────────────────────
drop policy if exists "Paper members can view paper" on public.papers;
drop policy if exists "EIC can create paper"         on public.papers;
drop policy if exists "EIC can update paper"         on public.papers;

create policy "Paper members can view paper"
  on public.papers for select using (public.is_paper_member(id));
create policy "EIC can create paper"
  on public.papers for insert with check (created_by = auth.uid());
create policy "EIC can update paper"
  on public.papers for update using (public.is_paper_eic(id));

-- ─── Policies: memberships ───────────────────────────────────────────────────
drop policy if exists "Members can view paper memberships" on public.memberships;
drop policy if exists "EIC can invite contributors"        on public.memberships;
drop policy if exists "Users can activate own membership"  on public.memberships;

create policy "Members can view paper memberships"
  on public.memberships for select using (public.is_paper_member(paper_id));
create policy "EIC can invite contributors"
  on public.memberships for insert with check (public.is_paper_eic(paper_id));
create policy "Users can activate own membership"
  on public.memberships for update using (user_id = auth.uid());

-- ─── Policies: invites ───────────────────────────────────────────────────────
drop policy if exists "Anyone can view invite by token" on public.invites;
drop policy if exists "EIC can create invites"          on public.invites;
drop policy if exists "Invite owner can claim"          on public.invites;

create policy "Anyone can view invite by token"
  on public.invites for select using (true);
create policy "EIC can create invites"
  on public.invites for insert with check (public.is_paper_eic(paper_id));
create policy "Invite owner can claim"
  on public.invites for update using (true);

-- ─── Policies: submissions ───────────────────────────────────────────────────
drop policy if exists "Paper members can view submissions"      on public.submissions;
drop policy if exists "Active members can submit"               on public.submissions;
drop policy if exists "EIC can update submissions (extraction)" on public.submissions;

create policy "Paper members can view submissions"
  on public.submissions for select using (public.is_paper_member(paper_id));
create policy "Active members can submit"
  on public.submissions for insert with check (
    user_id = auth.uid() and public.is_paper_member(paper_id)
  );
create policy "EIC can update submissions (extraction)"
  on public.submissions for update using (public.is_paper_eic(paper_id));

-- ─── Policies: editions ──────────────────────────────────────────────────────
drop policy if exists "Published editions are public" on public.editions;
drop policy if exists "EIC can view draft editions"   on public.editions;
drop policy if exists "EIC can create editions"       on public.editions;
drop policy if exists "EIC can update editions"       on public.editions;

create policy "Published editions are public"
  on public.editions for select using (status = 'published');
create policy "EIC can view draft editions"
  on public.editions for select using (
    status = 'draft' and public.is_paper_eic(paper_id)
  );
create policy "EIC can create editions"
  on public.editions for insert with check (public.is_paper_eic(paper_id));
create policy "EIC can update editions"
  on public.editions for update using (public.is_paper_eic(paper_id));
