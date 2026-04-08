import type { ExtractionResult } from '@/types'

// Paywall indicators — common patterns
const PAYWALL_INDICATORS = [
  'paywall',
  'subscribe to read',
  'subscribe to continue',
  'subscription required',
  'subscriber-only',
  'subscribers only',
  'sign in to read',
  'create an account',
  'piano-container',
  'tp-modal',
  'reg-wall',
  'regwall',
  'meter-paywall',
  'metered-content',
]

function detectPaywall(html: string): boolean {
  const lower = html.toLowerCase()
  return PAYWALL_INDICATORS.some(indicator => lower.includes(indicator))
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

function truncateAtWordBoundary(text: string, minWords: number, maxWords: number): string {
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0)
  let wordCount = 0
  const result: string[] = []

  for (const para of paragraphs) {
    const paraWords = countWords(para)
    if (wordCount >= minWords && wordCount + paraWords > maxWords) break
    result.push(para.trim())
    wordCount += paraWords
    if (wordCount >= maxWords) break
  }

  return result.join('\n\n')
}

export async function extractArticle(url: string): Promise<ExtractionResult> {
  let html: string

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Ragtag/1.0)',
        'Accept': 'text/html,application/xhtml+xml',
      },
    })
    clearTimeout(timeout)

    if (!res.ok) {
      return { text: null, status: 'failed', word_count: 0 }
    }

    html = await res.text()
  } catch {
    return { text: null, status: 'failed', word_count: 0 }
  }

  // Check for paywall before extraction
  if (detectPaywall(html)) {
    return { text: null, status: 'paywalled', word_count: 0 }
  }

  try {
    // Dynamic import to avoid bundling issues
    const { Readability } = await import('@mozilla/readability')
    const { JSDOM } = await import('jsdom')

    const dom = new JSDOM(html, { url })
    const reader = new Readability(dom.window.document, {
      charThreshold: 500,
    })
    const article = reader.parse()

    if (!article || !article.textContent) {
      return { text: null, status: 'failed', word_count: 0 }
    }

    const wordCount = countWords(article.textContent)

    // Too thin — probably a landing page or failed extraction
    if (wordCount < 200) {
      return { text: null, status: 'failed', word_count: wordCount }
    }

    // Re-check paywall on extracted content
    if (detectPaywall(article.textContent)) {
      return { text: null, status: 'paywalled', word_count: wordCount }
    }

    // Truncate to natural break between 400–600 words
    const truncated = truncateAtWordBoundary(article.textContent, 400, 600)
    const truncatedWordCount = countWords(truncated)

    return {
      text: truncated,
      status: 'success',
      word_count: truncatedWordCount,
    }
  } catch (err) {
    console.error('Readability extraction error:', err)
    return { text: null, status: 'failed', word_count: 0 }
  }
}

export function getExcerpt(text: string, maxWords: number = 300): string {
  const words = text.trim().split(/\s+/)
  if (words.length <= maxWords) return text
  return words.slice(0, maxWords).join(' ') + '…'
}
