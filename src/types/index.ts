// ─── Database row types ──────────────────────────────────────────────────────

export type UserRow = {
  id: string
  email: string
  phone: string | null
  display_name: string | null
  avatar_initial: string | null
  created_at: string
}

export type PaperRow = {
  id: string
  slug: string
  name: string
  masthead_tagline: string | null
  created_by: string
  cadence: 'weekly' | 'biweekly' | 'monthly'
  publish_day: number // 0=Sun … 6=Sat
  publish_time: string // HH:MM
  timezone: string
  tier: 'free' | 'paid'
  created_at: string
}

export type MembershipRow = {
  id: string
  paper_id: string
  user_id: string
  role: 'eic' | 'contributor'
  status: 'invited' | 'active'
  invited_at: string
  joined_at: string | null
}

export type InviteRow = {
  id: string
  paper_id: string
  email: string
  token: string
  claimed_by: string | null
  expires_at: string
  created_at: string
}

export type SubmissionRow = {
  id: string
  paper_id: string
  user_id: string
  edition_id: string | null
  url: string
  note: string | null
  og_title: string | null
  og_description: string | null
  og_image: string | null
  og_site_name: string | null
  extracted_text: string | null
  extraction_status: 'pending' | 'success' | 'paywalled' | 'failed'
  submitted_at: string
}

export type EditionRow = {
  id: string
  paper_id: string
  edition_number: number
  publish_at: string
  status: 'draft' | 'published'
  ai_sections: AISections | null
  created_at: string
}

// ─── AI types ────────────────────────────────────────────────────────────────

export type AISectionWeight = 'lead' | 'standard' | 'brief'

export type AISection = {
  title: string
  lede: string
  weight: AISectionWeight
  submission_ids: string[]
}

export type AIRecommendation = {
  title: string
  url: string
  source_name: string
  reason: string
}

export type AISections = {
  sections: AISection[]
  recommendations: AIRecommendation[]
}

// ─── Joined / view types ─────────────────────────────────────────────────────

export type SubmissionWithUser = SubmissionRow & {
  user: Pick<UserRow, 'id' | 'display_name' | 'avatar_initial'>
}

export type PaperWithMembership = PaperRow & {
  membership: MembershipRow
}

export type EditionWithSubmissions = EditionRow & {
  paper: PaperRow
  submissions: SubmissionWithUser[]
}

// ─── OG metadata ─────────────────────────────────────────────────────────────

export type OGMeta = {
  title: string | null
  description: string | null
  image: string | null
  site_name: string | null
  url: string
}

// ─── Article extraction ───────────────────────────────────────────────────────

export type ExtractionResult = {
  text: string | null
  status: 'success' | 'paywalled' | 'failed'
  word_count: number
}
