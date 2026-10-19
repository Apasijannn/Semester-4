import { useEffect, useState } from 'react'

export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = window.localStorage.getItem(key)
      return stored !== null ? JSON.parse(stored) : initialValue
    } catch {
      return initialValue
    }
  })

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // storage unavailable (e.g. private mode quota) - fail silently
    }
  }, [key, value])

  // Keeps this key in sync across tabs/windows of the app — the browser
  // only fires "storage" in *other* tabs, never the one that made the
  // write, so this can't loop back on itself.
  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key !== key || event.storageArea !== window.localStorage) return
      try {
        setValue(event.newValue !== null ? JSON.parse(event.newValue) : initialValue)
      } catch {
        // ignore malformed value written by another tab
      }
    }

    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return [value, setValue]
}
