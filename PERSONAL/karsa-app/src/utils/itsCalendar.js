export async function fetchItsCalendarEvents() {
  const response = await fetch('/api/its-calendar')
  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(data?.error || `ITS calendar sync failed (${response.status})`)
  }

  return data || []
}
