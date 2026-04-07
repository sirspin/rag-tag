import type { AISection, SubmissionWithUser } from '@/types'
import SubmissionArticle from './SubmissionArticle'

function getSiteName(sub: SubmissionWithUser): string {
  if (sub.og_site_name) return sub.og_site_name
  try { return new URL(sub.url).hostname.replace('www.', '') }
  catch { return 'Source' }
}

export default function LeadSection({
  section,
  submissions,
}: {
  section: AISection
  submissions: SubmissionWithUser[]
}) {
  const sectionSubmissions = section.submission_ids
    .map(id => submissions.find(s => s.id === id))
    .filter((s): s is SubmissionWithUser => s !== undefined)

  const [primary, ...secondary] = sectionSubmissions

  return (
    <section className="mt-10 mb-0">
      {/* Section header */}
      <div className="mb-6">
        <p className="section-header text-accent mb-1">{section.title}</p>
        <hr className="rule-thin mb-3" />
        {section.lede && (
          <p className="font-garamond italic text-text-secondary text-lg leading-relaxed">
            {section.lede}
          </p>
        )}
      </div>

      {/* Primary article — full width */}
      {primary && (
        <article className="mb-10">
          {/* OG image */}
          {primary.og_image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={primary.og_image}
              alt={primary.og_title || ''}
              className="w-full h-64 md:h-80 object-cover mb-6"
              loading="lazy"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          )}

          {/* Headline */}
          <h2
            className="font-playfair font-bold text-text-primary leading-tight mb-2"
            style={{ fontSize: 'clamp(1.5rem, 3vw, 2.25rem)' }}
          >
            <a
              href={primary.url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-accent transition-colors"
            >
              {primary.og_title || primary.url}
            </a>
          </h2>

          {/* Byline */}
          <p className="font-garamond italic text-text-secondary text-sm mb-4">
            by {primary.user?.display_name || 'A contributor'}
            &nbsp;&middot;&nbsp;
            <span className="font-courier not-italic text-xs">{getSiteName(primary)}</span>
          </p>

          {/* Pull quote — contributor's note */}
          {primary.note && (
            <blockquote className="pull-quote">
              &ldquo;{primary.note}&rdquo;
            </blockquote>
          )}

          {/* Article text */}
          <SubmissionArticle submission={primary} />
        </article>
      )}

      {/* Secondary lead submissions (if any) */}
      {secondary.length > 0 && (
        <div className="grid md:grid-cols-2 gap-8 pt-4 border-t border-rules/20">
          {secondary.map(sub => (
            <article key={sub.id}>
              {sub.og_image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={sub.og_image}
                  alt={sub.og_title || ''}
                  className="w-full h-40 object-cover mb-4"
                  loading="lazy"
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
              )}
              <h3 className="font-playfair font-bold text-xl text-text-primary leading-tight mb-1">
                <a href={sub.url} target="_blank" rel="noopener noreferrer" className="hover:text-accent">
                  {sub.og_title || sub.url}
                </a>
              </h3>
              <p className="font-garamond italic text-text-secondary text-sm mb-3">
                by {sub.user?.display_name || 'A contributor'}
              </p>
              {sub.note && (
                <p className="font-garamond italic text-text-secondary text-sm border-l-2 border-accent pl-3 mb-3">
                  &ldquo;{sub.note}&rdquo;
                </p>
              )}
              <SubmissionArticle submission={sub} />
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
