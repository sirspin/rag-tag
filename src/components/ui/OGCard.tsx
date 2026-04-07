import type { OGMeta } from '@/types'

export default function OGCard({ meta }: { meta: OGMeta }) {
  return (
    <div className="border border-rules/30 overflow-hidden">
      {meta.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={meta.image}
          alt={meta.title || ''}
          className="w-full h-40 object-cover"
          loading="lazy"
          onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
        />
      )}
      <div className="p-4">
        <p className="font-courier text-xs text-text-secondary mb-1 tracking-wide uppercase">
          {meta.site_name || new URL(meta.url).hostname}
        </p>
        <p className="font-playfair font-bold text-text-primary leading-tight mb-1">
          {meta.title || meta.url}
        </p>
        {meta.description && (
          <p className="font-lora text-text-secondary text-sm leading-relaxed line-clamp-2">
            {meta.description}
          </p>
        )}
      </div>
    </div>
  )
}
