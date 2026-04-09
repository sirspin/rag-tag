import type { AISection, SubmissionWithUser } from '@/types'

function getSiteName(sub: SubmissionWithUser): string {
  if (sub.og_site_name) return sub.og_site_name
  try { return new URL(sub.url).hostname.replace('www.', '') }
  catch { return 'Source' }
}

export default function BriefSection({
  section,
  submissions,
}: {
  section: AISection
  submissions: SubmissionWithUser[]
}) {
  const sectionSubmissions = section.submission_ids
    .map(id => submissions.find(s => s.id === id))
    .filter((s): s is SubmissionWithUser => s !== undefined)

  return (
    <section className="mb-0">
      {/* Section kicker bar */}
      <div className="flex items-center gap-0 border-b border-rules mb-0">
        <span className="section-kicker">{section.title}</span>
      </div>

      {/* Dense brief list — two columns if 3+ items, single otherwise */}
      <div
        className="grid pt-2"
        style={{
          gridTemplateColumns: sectionSubmissions.length >= 3 ? '1fr 1fr' : '1fr',
          gap: 0,
        }}
      >
        {sectionSubmissions.map((sub, i) => (
          <div
            key={sub.id}
            className={[
              'py-2',
              'border-b border-rules/60',
              // Right column items get left border
              sectionSubmissions.length >= 3 && i % 2 === 1 ? 'pl-3 border-l border-rules' : 'pr-3',
            ].join(' ')}
          >
            {/* Inline source + headline */}
            <div className="flex items-start gap-2">
              <span className="broadsheet-source shrink-0 pt-0.5">{getSiteName(sub)}</span>
              <h3 className="headline-brief leading-tight flex-1">
                <a
                  href={sub.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:opacity-70 transition-opacity"
                >
                  {sub.og_title || sub.url}
                </a>
              </h3>
            </div>
            <p className="broadsheet-byline mt-0.5">
              By {sub.user?.display_name ? (sub.user.role_title ? `${sub.user.display_name}, ${sub.user.role_title}` : sub.user.display_name) : 'Staff Reporter'}
            </p>
            {sub.note && (
              <p className="broadsheet-lede text-[0.68rem] mt-0.5">
                {sub.note}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
