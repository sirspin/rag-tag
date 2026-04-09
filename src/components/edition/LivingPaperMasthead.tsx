import type { PaperRow } from '@/types'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export default function LivingPaperMasthead({ paper }: { paper: PaperRow }) {
  const now = new Date()
  const dateStr = `${DAYS[now.getDay()]}, ${MONTHS[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`

  return (
    <header className="mb-0">
      {/* Top double rule */}
      <hr className="rule-broadsheet-double mb-0" />

      {/* Top metadata strip */}
      <div className="flex items-center justify-between py-1 border-b border-rules">
        <p className="font-arvo text-[0.58rem] tracking-[0.18em] uppercase text-text-secondary">
          {dateStr}
        </p>
        <p className="font-arvo text-[0.58rem] tracking-[0.18em] uppercase text-text-secondary">
          ragtag.is/p/{paper.slug}
        </p>
      </div>

      {/* Main masthead */}
      <div
        className="bg-text-primary text-background text-center py-4 px-2"
      >
        <h1
          className="font-quattrocento font-bold text-background leading-none tracking-tight"
          style={{
            fontSize: 'clamp(3rem, 10vw, 8rem)',
            letterSpacing: '0.02em',
            lineHeight: '0.9',
          }}
        >
          {paper.name}
        </h1>
      </div>

      {/* Tagline strip */}
      {paper.masthead_tagline && (
        <div className="border-b border-rules py-1.5 text-center">
          <p
            className="font-quattrocento italic text-text-secondary"
            style={{ fontSize: 'clamp(0.72rem, 1.4vw, 0.95rem)' }}
          >
            &ldquo;{paper.masthead_tagline}&rdquo;
          </p>
        </div>
      )}
    </header>
  )
}
