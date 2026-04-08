import type { SubmissionWithUser } from '@/types'

function getSiteName(sub: SubmissionWithUser): string {
  if (sub.og_site_name) return sub.og_site_name
  try { return new URL(sub.url).hostname.replace('www.', '') }
  catch { return 'Source' }
}

export default function SubmissionArticle({ submission }: { submission: SubmissionWithUser }) {
  const siteName = getSiteName(submission)

  if (submission.extraction_status === 'success' && submission.extracted_text) {
    const paragraphs = submission.extracted_text.split(/\n\n+/).filter(p => p.trim())

    return (
      <div className="prose-editorial">
        {paragraphs.map((para, i) => (
          <p key={i}>{para.trim()}</p>
        ))}
        <a
          href={submission.url}
          target="_blank"
          rel="noopener noreferrer"
          className="continue-reading"
        >
          Continue reading at {siteName} →
        </a>
      </div>
    )
  }

  // Paywalled or failed — show OG description
  return (
    <div>
      {submission.og_description && (
        <p className="font-quattrocento text-text-secondary leading-relaxed mb-4">
          {submission.og_description}
        </p>
      )}
      {!submission.og_description && submission.extraction_status === 'paywalled' && (
        <p className="font-quattrocento italic text-text-secondary mb-4">
          This article is behind a paywall.
        </p>
      )}
      <a
        href={submission.url}
        target="_blank"
        rel="noopener noreferrer"
        className="continue-reading"
      >
        Read the full story at {siteName} →
      </a>
    </div>
  )
}
