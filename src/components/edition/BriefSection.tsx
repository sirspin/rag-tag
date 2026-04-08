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
    <section className="mt-10 mb-0 max-w-lg">
      {/* Section header */}
      <div className="mb-5">
        <p className="section-header text-accent mb-1">{section.title}</p>
        <hr className="rule-thin mb-3" />
        {section.lede && (
          <p className="font-quattrocento italic text-text-secondary leading-relaxed">
            {section.lede}
          </p>
        )}
      </div>

      {/* Brief items — headline + byline + source only */}
      <div className="space-y-5">
        {sectionSubmissions.map((sub, i) => (
          <div key={sub.id} className={i > 0 ? 'pt-5 border-t border-rules/20' : ''}>
            <h3 className="font-quattrocento font-bold text-lg text-text-primary leading-tight mb-1">
              <a
                href={sub.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-accent transition-colors"
              >
                {sub.og_title || sub.url}
              </a>
            </h3>
            <p className="font-arvo text-xs text-text-secondary not-italic">
              by {sub.user?.display_name || 'A contributor'}
              &nbsp;&middot;&nbsp;
              <span>{getSiteName(sub)}</span>
            </p>
            {sub.note && (
              <p className="font-quattrocento italic text-text-secondary text-sm mt-1">
                &ldquo;{sub.note}&rdquo;
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
