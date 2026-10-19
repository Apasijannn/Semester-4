export function todayKey(date = new Date()) {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function formatDateLabel(dateKey) {
  const d = new Date(`${dateKey}T00:00:00`)
  return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }).toUpperCase()
}

export function formatCurrency(amount) {
  const value = Number(amount) || 0
  const sign = value < 0 ? '-' : ''
  const abs = Math.round(Math.abs(value))
  return `${sign}Rp${abs.toLocaleString('id-ID')}`
}

export function formatTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

export function formatDueDate(isoString) {
  const d = new Date(isoString)
  return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }).toUpperCase()
}

export function isOverdue(isoString) {
  return new Date(isoString).getTime() < Date.now()
}
