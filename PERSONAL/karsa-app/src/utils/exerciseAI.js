import { sendMessage } from './anthropic'
import { createId } from './id'

export const FALLBACK_EXERCISES = [
  { id: 'fallback-jalan-kaki', name: 'Jalan kaki', duration: 15, reps: null, intensity: 'ringan', category: 'Kardio' },
  { id: 'fallback-stretching', name: 'Stretching', duration: 10, reps: null, intensity: 'ringan', category: 'Fleksibilitas' },
  { id: 'fallback-tangga', name: 'Naik turun tangga', duration: 5, reps: null, intensity: 'sedang', category: 'Kardio' },
]

export const FALLBACK_MOTIVATION = 'Mulai dari yang ringan dulu aja, yang penting konsisten!'

const INTENSITY_MAP = {
  ringan: 'ringan',
  rendah: 'ringan',
  low: 'ringan',
  light: 'ringan',
  easy: 'ringan',
  sedang: 'sedang',
  medium: 'sedang',
  moderate: 'sedang',
  berat: 'berat',
  tinggi: 'berat',
  high: 'berat',
  hard: 'berat',
  intense: 'berat',
}

function normalizeIntensity(value) {
  const key = (value || '').toString().trim().toLowerCase()
  return INTENSITY_MAP[key] || 'sedang'
}

function normalizeExercise(raw) {
  return {
    id: createId(),
    name: raw?.name || 'Latihan',
    duration: Number(raw?.duration) || null,
    reps: raw?.reps || null,
    intensity: normalizeIntensity(raw?.intensity),
    category: raw?.category || 'Umum',
    completed: false,
  }
}

// Combines the exercise list AND the motivational line into one API call
// (one generation per day per the app's rate-limit design) instead of the
// two separate calls a literal reading of "JSON array only" + "1 kalimat
// dari AI" would imply — Claude returns a JSON object with both fields.
const SYSTEM_PROMPT =
  'Kamu adalah personal trainer yang memberikan rekomendasi olahraga harian yang realistis dan aman ' +
  'berdasarkan profil dan riwayat user. Sesuaikan intensitas dengan waktu tersedia. Kalau user sudah ' +
  'olahraga berat kemarin, sarankan recovery/ringan hari ini. Jawab HANYA dalam format JSON object dengan ' +
  'struktur persis: {"exercises": [{"name": string, "duration": number (menit, boleh null kalau pakai reps), ' +
  '"reps": string|null, "intensity": "ringan"|"sedang"|"berat", "category": string}], "motivation": string ' +
  '(1 kalimat singkat, santai, terkait progress user)}. Tanpa teks tambahan di luar JSON.'

export async function getExerciseRecommendation(profile, recentHistory, { apiKey, model } = {}) {
  if (!apiKey) {
    throw new Error('Missing Anthropic API key. Add one in Settings first.')
  }

  const userMessage =
    `Profil user (JSON):\n${JSON.stringify(profile, null, 2)}\n\n` +
    `Riwayat olahraga 3 hari terakhir (JSON):\n${JSON.stringify(recentHistory, null, 2)}`

  const reply = await sendMessage({
    apiKey,
    model,
    systemPrompt: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userMessage }],
  })

  const jsonMatch = reply.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('AI response was not in the expected format.')
  }

  const parsed = JSON.parse(jsonMatch[0])
  if (!Array.isArray(parsed.exercises) || parsed.exercises.length === 0) {
    throw new Error('AI response did not include any exercises.')
  }

  return {
    exercises: parsed.exercises.map(normalizeExercise),
    motivation: (parsed.motivation || '').trim() || FALLBACK_MOTIVATION,
  }
}
