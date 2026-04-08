import type { OGMeta } from '@/types'

// Private IP ranges to block (SSRF protection)
const PRIVATE_IP_PATTERNS = [
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
  /^192\.168\./,
  /^::1$/,
  /^localhost$/i,
  /^0\./,
]

function isPrivateHost(hostname: string): boolean {
  return PRIVATE_IP_PATTERNS.some(p => p.test(hostname))
}

export async function fetchOGMeta(url: string): Promise<OGMeta> {
  // Validate URL
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    throw new Error('Invalid URL')
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('Only HTTP/HTTPS URLs are allowed')
  }

  if (isPrivateHost(parsed.hostname)) {
    throw new Error('Private network addresses are not allowed')
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8000)

  let html: string
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Ragtag/1.0; +https://ragtag.is)',
        'Accept': 'text/html',
      },
    })
    clearTimeout(timeout)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    html = await res.text()
  } catch (err) {
    clearTimeout(timeout)
    throw err
  }

  // Parse OG tags
  function getMeta(property: string): string | null {
    const ogMatch = html.match(
      new RegExp(`<meta[^>]+property=["']og:${property}["'][^>]+content=["']([^"']+)["']`, 'i')
    ) || html.match(
      new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:${property}["']`, 'i')
    )
    if (ogMatch) return ogMatch[1].trim()

    // Fallback for non-OG tags
    if (property === 'title') {
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
      return titleMatch ? titleMatch[1].trim() : null
    }
    if (property === 'description') {
      const descMatch = html.match(
        /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i
      ) || html.match(
        /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i
      )
      return descMatch ? descMatch[1].trim() : null
    }
    if (property === 'site_name') {
      const siteMatch = html.match(/<meta[^>]+name=["']application-name["'][^>]+content=["']([^"']+)["']/i)
      return siteMatch ? siteMatch[1].trim() : new URL(url).hostname.replace('www.', '')
    }
    return null
  }

  // Try to get a clean site name
  const siteName = getMeta('site_name') || parsed.hostname.replace('www.', '')

  return {
    title: getMeta('title'),
    description: getMeta('description'),
    image: getMeta('image'),
    site_name: siteName,
    url,
  }
}
