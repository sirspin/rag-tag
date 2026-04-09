import type { AIRecommendation } from '@/types'

export default function Recommendations({ recommendations }: { recommendations: AIRecommendation[] }) {
  if (!recommendations || recommendations.length === 0) return null

  return (
    <section className="mb-0">
      {/* Section kicker bar */}
      <div className="border-b border-rules mb-0">
        <span className="section-kicker">Further Reading</span>
      </div>

      {/* Dense 3-column grid of recommendations */}
      <div
        className="grid"
        style={{
          gridTemplateColumns: `repeat(${Math.min(recommendations.length, 3)}, 1fr)`,
          gap: 0,
        }}
      >
        {recommendations.map((rec, i) => (
          <div
            key={i}
            className={[
              'py-3',
              i > 0 ? 'pl-3 border-l border-rules' : 'pr-3',
            ].join(' ')}
          >
            <p className="broadsheet-source mb-0.5">{rec.source_name}</p>
            <h4
              className="headline-brief text-[0.78rem] leading-snug mb-1"
              style={{ textTransform: 'none', letterSpacing: '0' }}
            >
              <a
                href={rec.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-quattrocento font-bold hover:opacity-70 transition-opacity"
                style={{ fontFamily: 'var(--font-quattrocento)', textTransform: 'none', letterSpacing: 'normal', fontSize: '0.82rem', lineHeight: '1.2' }}
              >
                {rec.title}
              </a>
            </h4>
          </div>
        ))}
      </div>
    </section>
  )
}
