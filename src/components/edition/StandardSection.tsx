import type { AISection, SubmissionWithUser } from '@/types'
import SubmissionArticle from './SubmissionArticle'

function getSiteName(sub: SubmissionWithUser): string {
  if (sub.og_site_name) return sub.og_site_name
  try { return new URL(sub.url).hostname.replace('www.', '') }
  catch { return 'Source' }
}

function SubmissionCard({ submission }: { submission: SubmissionWithUser }) {
  return (
    <article className="pt-3 pb-3">
      {submission.og_image && (
        <div className="mb-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={submission.og_image}
            alt={submission.og_title || ''}
            className="w-full object-cover"
            style={{ height: 'clamp(90px, 14vw, 160px)' }}
            loading="lazy"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
          <p className="broadsheet-caption">{getSiteName(submission)}</p>
        </div>
      )}

      <p className="broadsheet-byline">By {submission.user?.display_name ? (submission.user.role_title ? `${submission.user.display_name}, ${submission.user.role_title}` : submission.user.display_name) : 'Staff Reporter'}</p>

      <h3
        className="headline-standard mb-1"
        style={{ fontSize: 'clamp(1.1rem, 2.2vw, 1.6rem)' }}
      >
        <a
          href={submission.url}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:opacity-70 transition-opacity"
        >
          {submission.og_title || submission.url}
        </a>
      </h3>

      {!submission.og_image && (
        <p className="broadsheet-source mb-1">{getSiteName(submission)}</p>
      )}

      {submission.note && (
        <p className="broadsheet-lede text-[0.72rem] border-t border-rules/40 pt-1.5 mt-1.5">
          &ldquo;{submission.note}&rdquo;
        </p>
      )}

      <div className="prose-broadsheet mt-2">
        <SubmissionArticle submission={submission} />
      </div>
    </article>
  )
}

export default function StandardSection({
  section,
  submissions,
}: {
  section: AISection
  submissions: SubmissionWithUser[]
}) {
  const sectionSubmissions = section.submission_ids
    .map(id => submissions.find(s => s.id === id))
    .filter((s): s is SubmissionWithUser => s !== undefined)

  const colCount = Math.min(sectionSubmissions.length, 3)

  return (
    <section className="mb-0">
      {/* Section kicker bar */}
      <div className="flex items-center gap-0 border-b border-rules mb-0">
        <span className="section-kicker">{section.title}</span>
      </div>

      {/* Multi-column grid with vertical rules */}
      <div
        className="grid"
        style={{ gridTemplateColumns: `repeat(${colCount}, 1fr)`, gap: 0 }}
      >
        {sectionSubmissions.slice(0, 3).map((sub, i) => (
          <div
            key={sub.id}
            className={i > 0 ? 'border-l border-rules pl-3 pr-0' : 'pr-3'}
          >
            <SubmissionCard submission={sub} />
          </div>
        ))}
      </div>

      {/* Overflow — 4th+ in a horizontal strip below */}
      {sectionSubmissions.length > 3 && (
        <div className="border-t border-rules mt-0">
          {sectionSubmissions.slice(3).map((sub) => (
            <div key={sub.id} className="py-2 border-b border-rules/40 last:border-0 flex gap-4">
              <div className="flex-1">
                <p className="broadsheet-byline">By {sub.user?.display_name ? (sub.user.role_title ? `${sub.user.display_name}, ${sub.user.role_title}` : sub.user.display_name) : 'Staff Reporter'}</p>
                <h4 className="headline-brief">
                  <a href={sub.url} target="_blank" rel="noopener noreferrer" className="hover:opacity-70">
                    {sub.og_title || sub.url}
                  </a>
                </h4>
                {sub.note && (
                  <p className="broadsheet-lede text-[0.65rem] mt-0.5">{sub.note}</p>
                )}
              </div>
              <p className="broadsheet-source self-start pt-1">{getSiteName(sub)}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
