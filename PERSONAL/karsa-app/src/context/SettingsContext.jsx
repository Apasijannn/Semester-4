import { createContext, useMemo } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { DEFAULT_MODEL } from '../utils/anthropic'

export const SettingsContext = createContext(null)

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useLocalStorage('karsa_settings', {
    apiKey: '',
    model: DEFAULT_MODEL,
    lastItsSync: null,
  })

  const value = useMemo(() => {
    const setApiKey = (apiKey) => setSettings((prev) => ({ ...prev, apiKey }))
    const setModel = (model) => setSettings((prev) => ({ ...prev, model }))
    const clearApiKey = () => setSettings((prev) => ({ ...prev, apiKey: '' }))
    const setLastItsSync = (timestamp) => setSettings((prev) => ({ ...prev, lastItsSync: timestamp }))

    return { ...settings, setApiKey, setModel, clearApiKey, setLastItsSync }
  }, [settings, setSettings])

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}
