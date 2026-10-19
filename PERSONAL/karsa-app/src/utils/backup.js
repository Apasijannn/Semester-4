// Full-app backup/restore, since everything lives only in this browser's
// localStorage (no server, no cloud) — clearing browser data or switching
// browsers otherwise means total data loss.
const BACKUP_KEYS = [
  'karsa_tasks',
  'karsa_health_logs',
  'karsa_fitness_profile',
  'karsa_exercise_logs',
  'karsa_transactions',
  'karsa_statement_summaries',
  'karsa_chat_messages',
  'karsa_health_insight',
]

const BACKUP_VERSION = 1

export function exportBackup() {
  const data = {}

  BACKUP_KEYS.forEach((key) => {
    const raw = localStorage.getItem(key)
    if (raw === null) return
    try {
      data[key] = JSON.parse(raw)
    } catch {
      // skip malformed entries rather than fail the whole export
    }
  })

  // Deliberately excludes the Anthropic API key — a backup is a file that's
  // easy to accidentally share/upload, unlike localStorage itself.
  const rawSettings = localStorage.getItem('karsa_settings')
  if (rawSettings) {
    try {
      const { apiKey, ...safeSettings } = JSON.parse(rawSettings)
      data.karsa_settings = safeSettings
    } catch {
      // ignore malformed settings
    }
  }

  return {
    app: 'karsa',
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    data,
  }
}

export function downloadBackup() {
  const backup = exportBackup()
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `karsa-backup-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export async function importBackupFromFile(file) {
  const text = await file.text()
  let parsed
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error('That file is not valid JSON.')
  }

  if (!parsed || parsed.app !== 'karsa' || typeof parsed.data !== 'object') {
    throw new Error('This does not look like a Karsa backup file.')
  }

  let restoredCount = 0
  Object.entries(parsed.data).forEach(([key, value]) => {
    if (key === 'karsa_settings') {
      const existingRaw = localStorage.getItem('karsa_settings')
      const existing = existingRaw ? JSON.parse(existingRaw) : {}
      localStorage.setItem('karsa_settings', JSON.stringify({ ...existing, ...value, apiKey: existing.apiKey || '' }))
      restoredCount += 1
      return
    }
    if (!BACKUP_KEYS.includes(key)) return
    localStorage.setItem(key, JSON.stringify(value))
    restoredCount += 1
  })

  return restoredCount
}
