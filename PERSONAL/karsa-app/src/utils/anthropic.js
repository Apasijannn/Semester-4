const API_URL = 'https://api.anthropic.com/v1/messages'
const API_VERSION = '2023-06-01'

export const DEFAULT_MODEL = 'claude-sonnet-5'

export async function sendMessage({ apiKey, model, systemPrompt, messages }) {
  if (!apiKey) {
    throw new Error('Missing Anthropic API key. Add one in Settings first.')
  }

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': API_VERSION,
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: model || DEFAULT_MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    }),
  })

  if (!response.ok) {
    let detail = ''
    try {
      const errBody = await response.json()
      detail = errBody?.error?.message || JSON.stringify(errBody)
    } catch {
      detail = response.statusText
    }
    throw new Error(`Anthropic API error (${response.status}): ${detail}`)
  }

  const data = await response.json()
  const text = data?.content?.map((block) => block.text || '').join('\n').trim()
  return text || '(empty response)'
}
