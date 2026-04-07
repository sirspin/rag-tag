-- ─── Extensions ──────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─── Enums ───────────────────────────────────────────────────────────────────
create type cadence_type as enum ('weekly', 'biweekly', 'monthly');
create type tier_type as enum ('free', 'paid');
create type membership_role as enum ('eic', 'contributor');
create type membership_status as enum ('invited', 'active');
create type extraction_status as enum ('pending', 'success', 'paywalled', 'failed');
create type edition_status as enum ('draft', 'published');

-- ─── Tables ───────────────────────────────────────────────────────────────────

-- Users (mirrors auth.users, populated via trigger)
create table public.users (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null unique,
  phone       text,
  display_name text,
  avatar_initial text,
  created_at  timestamptz not null default now()
);

-- Papers
create table public.papers (
  id              uuid primary key default uuid_generate_v4(),
  slug            text not null unique,
  name            text not null,
  masthead_tagline text,
  created_by      uuid not null references public.users(id) on delete restrict,
  cadence         cadence_type not null default 'weekly',
  publish_day     int not null default 0 check (publish_day between 0 and 6),
  publish_time    time not null default '09:00',
  timezone        text not null default 'America/New_York',
  tier            tier_type not null default 'free',
  created_at      timestamptz not null default now()
);

-- Memberships
create table public.memberships (
  id          uuid primary key default uuid_generate_v4(),
  paper_id    uuid not null references public.papers(id) on delete cascade,
  user_id     uuid not null references public.users(id) on delete cascade,
  role        membership_role not null,
  status      membership_status not null default 'invited',
  invited_at  timestamptz not null default now(),
  joined_at   timestamptz,
  unique(paper_id, user_id)
);

-- Invites
create table public.invites (
  id          uuid primary key default uuid_generate_v4(),
  paper_id    uuid not null references public.papers(id) on delete cascade,
  email       text not null,
  token       text not null unique,
  claimed_by  uuid references public.users(id) on delete set null,
  expires_at  timestamptz not null,
  created_at  timestamptz not null default now()
);

-- Editions
create table public.editions (
  id              uuid primary key default uuid_generate_v4(),
  paper_id        uuid not null references public.papers(id) on delete cascade,
  edition_number  int not null,
  publish_at      timestamptz,
  status          edition_status not null default 'draft',
  ai_sections     jsonb,
  created_at      timestamptz not null default now(),
  unique(paper_id, edition_number)
);

-- Submissions
create table public.submissions (
  id                 uuid primary key default uuid_generate_v4(),
  paper_id           uuid not null references public.papers(id) on delete cascade,
  user_id            uuid not null references public.users(id) on delete cascade,
  edition_id         uuid references public.editions(id) on delete set null,
  url                text not null,
  note               text check (char_length(note) <= 140),
  og_title           text,
  og_description     text,
  og_image           text,
  og_site_name       text,
  extracted_text     text,
  extraction_status  extraction_status not null default 'pending',
  submitted_at       timestamptz not null default now()
);

-- ─── Indexes ─────────────────────────────────────────────────────────────────
create index on public.memberships(paper_id);
create index on public.memberships(user_id);
create index on public.submissions(paper_id);
create index on public.submissions(edition_id);
create index on public.editions(paper_id);
create index on public.invites(token);

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
    set display_name = coalesce(excluded.display_name, public.users.display_name),
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

-- users: can read/update own row
create policy "Users can view own profile"
  on public.users for select using (auth.uid() = id);
create policy "Users can update own profile"
  on public.users for update using (auth.uid() = id);
create policy "Users can insert own profile"
  on public.users for insert with check (auth.uid() = id);

-- papers: members can read; eic can insert/update
create policy "Paper members can view paper"
  on public.papers for select using (
    exists (
      select 1 from public.memberships m
      where m.paper_id = papers.id
        and m.user_id = auth.uid()
        and m.status = 'active'
    )
  );
create policy "EIC can create paper"
  on public.papers for insert with check (created_by = auth.uid());
create policy "EIC can update paper"
  on public.papers for update using (
    exists (
      select 1 from public.memberships m
      where m.paper_id = papers.id
        and m.user_id = auth.uid()
        and m.role = 'eic'
        and m.status = 'active'
    )
  );

-- memberships: members can view their own paper's memberships; eic can insert
create policy "Members can view paper memberships"
  on public.memberships for select using (
    exists (
      select 1 from public.memberships m
      where m.paper_id = memberships.paper_id
        and m.user_id = auth.uid()
        and m.status = 'active'
    )
  );
create policy "EIC can invite contributors"
  on public.memberships for insert with check (
    exists (
      select 1 from public.memberships m
      where m.paper_id = memberships.paper_id
        and m.user_id = auth.uid()
        and m.role = 'eic'
        and m.status = 'active'
    )
  );
create policy "Users can activate own membership"
  on public.memberships for update using (user_id = auth.uid());

-- invites: public select by token; eic can insert
create policy "Anyone can view invite by token"
  on public.invites for select using (true);
create policy "EIC can create invites"
  on public.invites for insert with check (
    exists (
      select 1 from public.memberships m
      where m.paper_id = invites.paper_id
        and m.user_id = auth.uid()
        and m.role = 'eic'
        and m.status = 'active'
    )
  );
create policy "Invite owner can claim"
  on public.invites for update using (true);

-- submissions: paper members can view; active members/eic can insert
create policy "Paper members can view submissions"
  on public.submissions for select using (
    exists (
      select 1 from public.memberships m
      where m.paper_id = submissions.paper_id
        and m.user_id = auth.uid()
        and m.status = 'active'
    )
  );
create policy "Active members can submit"
  on public.submissions for insert with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.memberships m
      where m.paper_id = submissions.paper_id
        and m.user_id = auth.uid()
        and m.status = 'active'
    )
  );
create policy "EIC can update submissions (extraction)"
  on public.submissions for update using (
    exists (
      select 1 from public.memberships m
      where m.paper_id = submissions.paper_id
        and m.user_id = auth.uid()
        and m.role = 'eic'
        and m.status = 'active'
    )
  );

-- editions: published = public; draft = eic only
create policy "Published editions are public"
  on public.editions for select using (status = 'published');
create policy "EIC can view draft editions"
  on public.editions for select using (
    status = 'draft'
    and exists (
      select 1 from public.memberships m
      where m.paper_id = editions.paper_id
        and m.user_id = auth.uid()
        and m.role = 'eic'
        and m.status = 'active'
    )
  );
create policy "EIC can create editions"
  on public.editions for insert with check (
    exists (
      select 1 from public.memberships m
      where m.paper_id = editions.paper_id
        and m.user_id = auth.uid()
        and m.role = 'eic'
        and m.status = 'active'
    )
  );
create policy "EIC can update editions"
  on public.editions for update using (
    exists (
      select 1 from public.memberships m
      where m.paper_id = editions.paper_id
        and m.user_id = auth.uid()
        and m.role = 'eic'
        and m.status = 'active'
    )
  );
