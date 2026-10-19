import { sendMessage } from './anthropic'

const SYSTEM_PROMPT =
  'Kamu adalah asisten kesehatan personal yang ramah dan santai. Berikan 1 insight singkat (maksimal 2 kalimat) ' +
  'berdasarkan data berikut. Fokus pada pola yang perlu diperhatikan atau apresiasi kalau progressnya bagus. ' +
  'Gunakan bahasa Indonesia casual, jangan menggurui.'

// Special-case triggers that steer the single AI call toward the most
// relevant pattern instead of a generic summary — checked in priority order.
export function detectFocusHint(healthData) {
  const { hydrationToday = 0, hydrationGoal = 8, sleepHours = [], habitStreak = 0 } = healthData

  if (hydrationGoal > 0 && hydrationToday / hydrationGoal < 0.5 && new Date().getHours() >= 18) {
    return 'Fokus khusus: hidrasi hari ini masih di bawah 50% dari target padahal sudah lewat jam 6 sore. Ingatkan dengan santai untuk minum air.'
  }

  const recentNights = sleepHours.filter((h) => h > 0).slice(-3)
  if (recentNights.length >= 3) {
    const avg = recentNights.reduce((sum, h) => sum + h, 0) / recentNights.length
    if (avg < 6) {
      return 'Fokus khusus: rata-rata jam tidur 3 hari terakhir di bawah 6 jam. Soroti pola ini dengan nada peduli, bukan menggurui.'
    }
  }

  if (habitStreak > 0 && habitStreak % 7 === 0) {
    return `Fokus khusus: streak habit sudah mencapai ${habitStreak} hari (kelipatan minggu penuh). Berikan apresiasi/perayaan singkat.`
  }

  return null
}

export async function getHealthInsight(healthData, { apiKey, model, focusHint } = {}) {
  const hint = focusHint !== undefined ? focusHint : detectFocusHint(healthData)

  const userMessage = `Data kesehatan hari ini (JSON):\n${JSON.stringify(healthData, null, 2)}${
    hint ? `\n\n${hint}` : ''
  }`

  const reply = await sendMessage({
    apiKey,
    model,
    systemPrompt: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userMessage }],
  })

  return reply.trim()
}
