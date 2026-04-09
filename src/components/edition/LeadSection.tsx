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
    <section className="mb-0">
      {/* Section kicker bar */}
      <div className="flex items-center gap-0 border-b border-rules mb-0">
        <span className="section-kicker">{section.title}</span>
      </div>

      {/* Lead layout: large primary left, secondary stack right */}
      {primary && (
        <div
          className="grid"
          style={{
            gridTemplateColumns: secondary.length > 0 ? '2fr 1fr' : '1fr',
            gap: 0,
          }}
        >
          {/* Primary — large left column */}
          <article className="pr-4 border-r border-rules pt-3 pb-4">
            {primary.og_image && (
              <div className="mb-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={primary.og_image}
                  alt={primary.og_title || ''}
                  className="w-full object-cover"
                  style={{ height: 'clamp(160px, 22vw, 320px)' }}
                  loading="lazy"
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
                <p className="broadsheet-caption">{getSiteName(primary)}</p>
              </div>
            )}

            <p className="broadsheet-byline">By {primary.user?.display_name ? (primary.user.role_title ? `${primary.user.display_name}, ${primary.user.role_title}` : primary.user.display_name) : 'Staff Reporter'}</p>

            <h2
              className="headline-lead mb-2"
              style={{ fontSize: 'clamp(1.8rem, 4.5vw, 3.5rem)' }}
            >
              <a
                href={primary.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:opacity-70 transition-opacity"
              >
                {primary.og_title || primary.url}
              </a>
            </h2>

            {primary.note && (
              <p className="broadsheet-lede border-t border-rules pt-2 mt-2 mb-3">
                &ldquo;{primary.note}&rdquo;
              </p>
            )}

            <div className="prose-broadsheet">
              <SubmissionArticle submission={primary} />
            </div>
          </article>

          {/* Secondary — stacked right column */}
          {secondary.length > 0 && (
            <div className="pl-3 pt-3 flex flex-col gap-0">
              {secondary.map((sub, i) => (
                <article
                  key={sub.id}
                  className={i > 0 ? 'pt-3 border-t border-rules mt-3' : ''}
                >
                  {sub.og_image && (
                    <div className="mb-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={sub.og_image}
                        alt={sub.og_title || ''}
                        className="w-full object-cover"
                        style={{ height: 'clamp(90px, 12vw, 150px)' }}
                        loading="lazy"
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                      />
                    </div>
                  )}
                  <p className="broadsheet-byline">By {sub.user?.display_name ? (sub.user.role_title ? `${sub.user.display_name}, ${sub.user.role_title}` : sub.user.display_name) : 'Staff Reporter'}</p>
                  <h3
                    className="headline-standard mb-1"
                    style={{ fontSize: 'clamp(1rem, 2vw, 1.35rem)' }}
                  >
                    <a
                      href={sub.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:opacity-70 transition-opacity"
                    >
                      {sub.og_title || sub.url}
                    </a>
                  </h3>
                  {sub.note && (
                    <p className="broadsheet-lede text-[0.72rem] mt-1">
                      {sub.note}
                    </p>
                  )}
                  <p className="broadsheet-source mt-1">{getSiteName(sub)}</p>
                </article>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  )
}
