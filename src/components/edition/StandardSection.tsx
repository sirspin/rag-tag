import type { AISection, SubmissionWithUser } from '@/types'
import SubmissionArticle from './SubmissionArticle'

function getSiteName(sub: SubmissionWithUser): string {
  if (sub.og_site_name) return sub.og_site_name
  try { return new URL(sub.url).hostname.replace('www.', '') }
  catch { return 'Source' }
}

function SubmissionCard({ submission }: { submission: SubmissionWithUser }) {
  return (
    <article>
      {submission.og_image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={submission.og_image}
          alt={submission.og_title || ''}
          className="w-full h-40 object-cover mb-4"
          loading="lazy"
          onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
        />
      )}

      <h3 className="font-quattrocento font-bold text-xl text-text-primary leading-tight mb-1">
        <a
          href={submission.url}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-accent transition-colors"
        >
          {submission.og_title || submission.url}
        </a>
      </h3>

      <p className="font-arvo text-xs text-text-secondary not-italic mb-3">
        by {submission.user?.display_name || 'A contributor'}
        &nbsp;&middot;&nbsp;
        <span>{getSiteName(submission)}</span>
      </p>

      {submission.note && (
        <p className="font-quattrocento italic text-text-secondary text-sm border-l-2 border-rules/40 pl-3 mb-3">
          &ldquo;{submission.note}&rdquo;
        </p>
      )}

      <SubmissionArticle submission={submission} />
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

  return (
    <section className="mt-10 mb-0">
      {/* Section header */}
      <div className="mb-6">
        <p className="section-header text-accent mb-1">{section.title}</p>
        <hr className="rule-thin mb-3" />
        {section.lede && (
          <p className="font-quattrocento italic text-text-secondary leading-relaxed">
            {section.lede}
          </p>
        )}
      </div>

      {/* Two-column grid */}
      <div
        className="grid gap-8"
        style={{
          gridTemplateColumns: `repeat(${Math.min(sectionSubmissions.length, 2)}, 1fr)`,
        }}
      >
        {sectionSubmissions.map((sub, i) => (
          <div
            key={sub.id}
            className={i > 0 ? 'md:border-l md:border-rules/30 md:pl-8' : ''}
          >
            <SubmissionCard submission={sub} />
          </div>
        ))}
      </div>

      {/* Overflow submissions — 3rd+ in single column below */}
      {sectionSubmissions.length > 2 &&
        sectionSubmissions.slice(2).map(sub => (
          <div key={sub.id} className="mt-8 pt-8 border-t border-rules/20">
            <SubmissionCard submission={sub} />
          </div>
        ))}
    </section>
  )
}
