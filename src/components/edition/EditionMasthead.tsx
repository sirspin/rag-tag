import type { PaperRow, EditionRow, UserRow } from '@/types'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return `${DAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
}

export default function EditionMasthead({
  paper,
  edition,
  contributors,
}: {
  paper: PaperRow
  edition: EditionRow
  contributors: Pick<UserRow, 'id' | 'display_name'>[]
}) {
  const publishDate = edition.publish_at ? formatDate(edition.publish_at) : formatDate(edition.created_at)
  const editionBadge = `Edition #${String(edition.edition_number).padStart(4, '0')}`

  // contributors prop retained for API compatibility but not rendered
  void contributors

  return (
    <header className="text-center mb-0">
      {/* Top thin rule */}
      <hr className="rule-thin mb-3" />

      {/* Vol / date / edition line */}
      <p className="font-arvo text-xs tracking-widest text-text-secondary mb-3">
        Vol. 1 &nbsp;&middot;&nbsp; {publishDate} &nbsp;&middot;&nbsp; {editionBadge}
      </p>

      {/* Second thin rule */}
      <hr className="rule-thin mb-8" />

      {/* Paper name — masthead */}
      <h1
        className="masthead-name text-center leading-none mb-4"
        style={{
          fontSize: 'clamp(3.5rem, 9vw, 7rem)',
          letterSpacing: '0.04em',
        }}
      >
        {paper.name}
      </h1>

      {/* Tagline */}
      {paper.masthead_tagline && (
        <p
          className="font-quattrocento italic text-text-secondary mb-6"
          style={{ fontSize: 'clamp(1rem, 2vw, 1.25rem)' }}
        >
          &ldquo;{paper.masthead_tagline}&rdquo;
        </p>
      )}

      {/* Thick rule */}
      <hr className="rule-thick" />
    </header>
  )
}
