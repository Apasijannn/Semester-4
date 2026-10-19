import { sendMessage } from './anthropic'

export const CATEGORIES = [
  'Makan Harian',
  'Belanja Retail',
  'Transportasi',
  'Kesehatan',
  'Hiburan',
  'Transfer',
  'Lainnya',
]

// Checked in order — first match wins. Most-specific/least-ambiguous rules
// (Transfer, Kesehatan, Hiburan) come before broad, easy-to-collide ones
// (Makan Harian) so e.g. "APOTEK K24" doesn't fall through to something else.
const KEYWORD_RULES = [
  { category: 'Transfer', keywords: ['ditransfer ke', 'tarik tunai', 'top up', 'topup'] },
  { category: 'Kesehatan', keywords: ['apotek', 'klinik', 'rumah sakit', 'k24'] },
  { category: 'Hiburan', keywords: ['cinema', 'xxi', 'bioskop', 'cgv'] },
  { category: 'Transportasi', keywords: ['spbu', 'grab', 'gojek', 'parkir'] },
  {
    category: 'Belanja Retail',
    keywords: ['indomaret', 'alfamart', 'alfamidi', 'superindo', 'minimarket', 'supermarket'],
  },
  {
    category: 'Makan Harian',
    keywords: [
      'warung', 'geprek', 'geprak', 'cafe', 'kopi', 'bakar', 'hotpot', 'hot pot',
      'gamchi', 'brunsj', 'restoran', 'resto', 'makan',
    ],
  },
]

export function categorizeByKeyword(description) {
  const normalized = (description || '').toLowerCase()
  for (const rule of KEYWORD_RULES) {
    if (rule.keywords.some((keyword) => normalized.includes(keyword))) {
      return rule.category
    }
  }
  return null
}

function coerceCategory(value) {
  const trimmed = (value || '').trim()
  return CATEGORIES.includes(trimmed) ? trimmed : 'Lainnya'
}

export async function categorizeWithAI(description, { apiKey, model } = {}) {
  if (!apiKey) return 'Lainnya'

  try {
    const reply = await sendMessage({
      apiKey,
      model,
      systemPrompt: 'You classify Indonesian e-wallet transaction descriptions into exactly one category. Reply with only the category name, nothing else.',
      messages: [
        {
          role: 'user',
          content: `Classify this Indonesian merchant/transaction name into one category: Makan Harian, Belanja Retail, Transportasi, Kesehatan, Hiburan, Transfer, atau Lainnya. Transaction: '${description}'. Reply with only the category name.`,
        },
      ],
    })
    return coerceCategory(reply)
  } catch {
    return 'Lainnya'
  }
}

// Classifies many descriptions in a single API call instead of one call per
// transaction — used by the UI's batched "Categorize with AI" action. Unlike
// categorizeWithAI (a silent best-effort fallback), this throws on failure
// so the interactive caller can show the user a real error instead of
// quietly reporting "success" while nothing actually changed.
export async function categorizeBatchWithAI(descriptions, { apiKey, model } = {}) {
  if (!apiKey) {
    throw new Error('Missing Anthropic API key. Add one in Settings first.')
  }
  if (descriptions.length === 0) {
    return []
  }

  const numbered = descriptions.map((d, i) => `${i + 1}. ${d}`).join('\n')

  const reply = await sendMessage({
    apiKey,
    model,
    systemPrompt:
      'You classify Indonesian e-wallet transaction descriptions into exactly one of these categories: ' +
      `${CATEGORIES.join(', ')}. Reply with ONLY a JSON array of category strings, one per numbered ` +
      'transaction, in the same order, with no other text.',
    messages: [{ role: 'user', content: numbered }],
  })

  const jsonMatch = reply.match(/\[[\s\S]*\]/)
  if (!jsonMatch) {
    throw new Error('AI response was not in the expected format.')
  }
  const parsed = JSON.parse(jsonMatch[0])
  return descriptions.map((_, i) => coerceCategory(parsed[i]))
}

export async function categorizeTransaction(description, aiOptions) {
  const keywordMatch = categorizeByKeyword(description)
  if (keywordMatch) return keywordMatch
  return categorizeWithAI(description, aiOptions)
}
