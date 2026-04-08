import Anthropic from '@anthropic-ai/sdk'
import type { AISections, SubmissionWithUser } from '@/types'
import { getExcerpt } from './extraction'

const SYSTEM_PROMPT = `You are the editorial AI for Ragtag, a collaborative newspaper platform.
Your job is to turn a group of friends' submitted links into a beautifully organized newspaper edition.

Rules:
- For each section, write a kicker: one or two words that sound like something a dry, well-read person said at dinner — not a category name. Understated. Mildly sardonic without trying. Not Gen-Z. Not literary. Reflects what the stories are actually doing this week, not what shelf they'd sit on. Write this as the "title" field.
- Write a 1-2 sentence editorial lede for each section that feels authored and specific to what's in it. Dry, warm, occasionally wry. Never generic.
- Assign each section a weight: "lead" (1-2 strong submissions, gets full-width treatment), "standard" (2-3 submissions, column grid), or "brief" (1 short item, runs narrow). Every edition should have a different combination of weights so no two editions look identical. Maximum one "lead" section per edition.
- Supply 2-4 article recommendations based on themes present. More recommendations if the edition is thin on submissions, fewer if rich.
- Order submissions within sections by editorial flow, not submission order.
- Every submission_id in your response must be one of the IDs provided in the input. Do not invent IDs.

Return ONLY valid JSON. No preamble, no markdown fencing, no explanation. The JSON must match exactly:
{
  "sections": [
    {
      "title": "string",
      "lede": "string",
      "weight": "lead|standard|brief",
      "submission_ids": ["uuid"]
    }
  ],
  "recommendations": [
    {
      "title": "string",
      "url": "string",
      "source_name": "string",
      "reason": "string"
    }
  ]
}`

type SubmissionPayload = {
  id: string
  url: string
  og_title: string | null
  og_description: string | null
  og_site_name: string | null
  note: string | null
  contributor_display_name: string
  extracted_text_excerpt: string | null
}

export async function compileEdition(
  paperName: string,
  editionNumber: number,
  submissions: SubmissionWithUser[],
): Promise<AISections> {
  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  })

  const payload = {
    paper_name: paperName,
    edition_number: editionNumber,
    submissions: submissions.map((s): SubmissionPayload => ({
      id: s.id,
      url: s.url,
      og_title: s.og_title,
      og_description: s.og_description,
      og_site_name: s.og_site_name,
      note: s.note,
      contributor_display_name: s.user.display_name || 'A contributor',
      extracted_text_excerpt: s.extracted_text ? getExcerpt(s.extracted_text, 300) : null,
    })),
  }

  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: JSON.stringify(payload, null, 2) }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''

  // Strip any accidental markdown fencing
  const cleaned = text.replace(/^```json\n?/i, '').replace(/\n?```$/i, '').trim()

  const result: AISections = JSON.parse(cleaned)

  // Validate that all submission_ids exist
  const validIds = new Set(submissions.map(s => s.id))
  for (const section of result.sections) {
    section.submission_ids = section.submission_ids.filter(id => validIds.has(id))
  }

  return result
}
