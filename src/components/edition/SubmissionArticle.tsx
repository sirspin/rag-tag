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
      <div className="prose-broadsheet">
        {paragraphs.map((para, i) => (
          <p key={i}>{para.trim()}</p>
        ))}
        <a
          href={submission.url}
          target="_blank"
          rel="noopener noreferrer"
          className="font-arvo text-[0.65rem] tracking-[0.1em] uppercase text-text-secondary hover:text-accent transition-colors block mt-2"
        >
          ↗ Continue reading at {siteName}
        </a>
      </div>
    )
  }

  // Paywalled or failed — show OG description
  return (
    <div>
      {submission.og_description && (
        <p className="broadsheet-body mb-2">
          {submission.og_description}
        </p>
      )}
      {!submission.og_description && submission.extraction_status === 'paywalled' && (
        <p className="broadsheet-lede text-[0.72rem] mb-2">
          This article is behind a paywall.
        </p>
      )}
      <a
        href={submission.url}
        target="_blank"
        rel="noopener noreferrer"
        className="font-arvo text-[0.65rem] tracking-[0.1em] uppercase text-text-secondary hover:text-accent transition-colors block mt-1"
      >
        ↗ Read at {siteName}
      </a>
    </div>
  )
}
