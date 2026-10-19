import { useState } from 'react'
import { useSettings } from '../hooks/useSettings'
import { useTasks } from '../hooks/useTasks'
import { useExercise } from '../hooks/useExercise'
import { RetroButton } from '../components/ui/RetroButton'
import { TerminalInput } from '../components/ui/TerminalInput'
import { BentoCard } from '../components/ui/BentoCard'
import { fetchItsCalendarEvents } from '../utils/itsCalendar'
import { formatTime } from '../utils/format'
import { downloadBackup, importBackupFromFile } from '../utils/backup'

const ACTIVITY_LEVELS = [
  { value: 'sedentary', label: 'Sedentary (jarang gerak)' },
  { value: 'ringan', label: 'Ringan' },
  { value: 'sedang', label: 'Sedang' },
  { value: 'aktif', label: 'Aktif' },
]

const FITNESS_GOALS = [
  { value: 'turun-bb', label: 'Nurunin berat badan' },
  { value: 'stamina', label: 'Nambah stamina' },
  { value: 'kebugaran', label: 'Jaga kebugaran' },
  { value: 'bentuk-otot', label: 'Bentuk otot' },
]

export function Settings() {
  const { apiKey, model, setApiKey, setModel, clearApiKey, lastItsSync, setLastItsSync } = useSettings()
  const { importTasks } = useTasks()
  const { profile, setProfile } = useExercise()
  const [draftKey, setDraftKey] = useState(apiKey)
  const [draftModel, setDraftModel] = useState(model)
  const [saved, setSaved] = useState(false)
  const [syncStatus, setSyncStatus] = useState({ state: 'idle', message: '' })
  const [draftProfile, setDraftProfile] = useState(profile)
  const [profileSaved, setProfileSaved] = useState(false)
  const [backupStatus, setBackupStatus] = useState({ state: 'idle', message: '' })

  const handleSave = (e) => {
    e.preventDefault()
    setApiKey(draftKey.trim())
    setModel(draftModel.trim())
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleSaveProfile = (e) => {
    e.preventDefault()
    setProfile({ ...draftProfile, minutesAvailable: Number(draftProfile.minutesAvailable) || 0 })
    setProfileSaved(true)
    setTimeout(() => setProfileSaved(false), 2000)
  }

  const handleImportBackup = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setBackupStatus({ state: 'busy', message: '' })
    try {
      const restoredCount = await importBackupFromFile(file)
      setBackupStatus({ state: 'success', message: `Restored ${restoredCount} data set(s). Reloading...` })
      setTimeout(() => window.location.reload(), 1200)
    } catch (err) {
      setBackupStatus({ state: 'error', message: err.message || 'Import failed.' })
    } finally {
      e.target.value = ''
    }
  }

  const handleSync = async () => {
    setSyncStatus({ state: 'syncing', message: '' })
    try {
      const events = await fetchItsCalendarEvents()
      const { added, updated } = importTasks(events)
      setLastItsSync(Date.now())
      setSyncStatus({ state: 'success', message: `Added ${added}, updated ${updated} (${events.length} events found).` })
    } catch (err) {
      setSyncStatus({ state: 'error', message: err.message || 'Sync failed.' })
    }
  }

  return (
    <div className="max-w-2xl">
      <h2 className="font-headline-xl text-headline-xl text-primary mb-stack-lg">Settings</h2>

      <BentoCard className="mb-stack-lg">
        <h3 className="font-headline-lg text-headline-lg text-primary mb-stack-sm">Anthropic API Key</h3>
        <p className="font-body-sm text-body-sm text-on-surface-variant mb-stack-md">
          Your key is stored only in this browser's localStorage and is sent directly from your browser to
          Anthropic's API to power the Chat module — it never touches any server of ours. Never share this key.
        </p>
        <form onSubmit={handleSave} className="flex flex-col gap-stack-md">
          <label className="flex flex-col gap-1">
            <span className="font-label-caps text-label-caps text-on-surface-variant">API Key</span>
            <TerminalInput
              type="password"
              autoComplete="off"
              value={draftKey}
              onChange={(e) => setDraftKey(e.target.value)}
              placeholder="sk-ant-..."
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="font-label-caps text-label-caps text-on-surface-variant">Model</span>
            <TerminalInput value={draftModel} onChange={(e) => setDraftModel(e.target.value)} placeholder="claude-sonnet-5" />
          </label>

          <div className="flex items-center gap-stack-md">
            <RetroButton type="submit" icon="save">
              Save
            </RetroButton>
            <RetroButton
              type="button"
              variant="ghost"
              icon="delete"
              onClick={() => {
                clearApiKey()
                setDraftKey('')
              }}
            >
              Clear Key
            </RetroButton>
            {saved && <span className="font-label-caps text-label-caps text-tertiary-container">SAVED</span>}
          </div>
        </form>
      </BentoCard>

      <BentoCard className="mb-stack-lg">
        <h3 className="font-headline-lg text-headline-lg text-primary mb-stack-sm">Fitness Profile</h3>
        <p className="font-body-sm text-body-sm text-on-surface-variant mb-stack-md">
          Used by the Exercise section on the Health page to personalize your daily recommendation.
        </p>
        <form onSubmit={handleSaveProfile} className="flex flex-col gap-stack-md">
          <label className="flex flex-col gap-1">
            <span className="font-label-caps text-label-caps text-on-surface-variant">Level Aktivitas</span>
            <select
              className="brutal-border bg-surface p-2 font-body-sm text-body-sm"
              value={draftProfile.activityLevel}
              onChange={(e) => setDraftProfile({ ...draftProfile, activityLevel: e.target.value })}
            >
              {ACTIVITY_LEVELS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="font-label-caps text-label-caps text-on-surface-variant">Tujuan Olahraga</span>
            <select
              className="brutal-border bg-surface p-2 font-body-sm text-body-sm"
              value={draftProfile.goal}
              onChange={(e) => setDraftProfile({ ...draftProfile, goal: e.target.value })}
            >
              {FITNESS_GOALS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="font-label-caps text-label-caps text-on-surface-variant">Waktu Tersedia per Hari (menit)</span>
            <TerminalInput
              type="number"
              min="5"
              step="5"
              value={draftProfile.minutesAvailable}
              onChange={(e) => setDraftProfile({ ...draftProfile, minutesAvailable: e.target.value })}
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="font-label-caps text-label-caps text-on-surface-variant">Kondisi Fisik / Catatan (opsional)</span>
            <textarea
              className="terminal-input font-body-md text-body-md py-2 px-1 w-full focus:ring-0"
              rows={2}
              placeholder="misal: ada cedera lutut"
              value={draftProfile.notes}
              onChange={(e) => setDraftProfile({ ...draftProfile, notes: e.target.value })}
            />
          </label>

          <div className="flex items-center gap-stack-md">
            <RetroButton type="submit" icon="save">
              Save Profile
            </RetroButton>
            {profileSaved && <span className="font-label-caps text-label-caps text-tertiary-container">SAVED</span>}
          </div>
        </form>
      </BentoCard>

      <BentoCard>
        <h3 className="font-headline-lg text-headline-lg text-primary mb-stack-sm">ITS Classroom Sync</h3>
        <p className="font-body-sm text-body-sm text-on-surface-variant mb-stack-md">
          Pulls assignment deadlines from your classroom.its.ac.id calendar feed into Tasks. The feed URL (with your
          personal token) is configured in the <code>.env.local</code> file in the project folder — it is never
          stored in the browser. Edit that file and restart <code>npm run dev</code> to change it.
        </p>

        <div className="flex items-center gap-stack-md flex-wrap">
          <RetroButton
            type="button"
            icon="sync"
            onClick={handleSync}
            disabled={syncStatus.state === 'syncing'}
          >
            {syncStatus.state === 'syncing' ? 'Syncing...' : 'Sync Now'}
          </RetroButton>
          {lastItsSync && (
            <span className="font-label-caps text-label-caps text-on-surface-variant">
              Last synced: {formatTime(lastItsSync)}
            </span>
          )}
        </div>

        {syncStatus.message && (
          <p
            className={`font-body-sm text-body-sm mt-stack-md ${
              syncStatus.state === 'error' ? 'text-secondary' : 'text-tertiary-container'
            }`}
          >
            {syncStatus.message}
          </p>
        )}
      </BentoCard>

      <BentoCard className="mt-stack-lg">
        <h3 className="font-headline-lg text-headline-lg text-primary mb-stack-sm">Backup & Restore</h3>
        <p className="font-body-sm text-body-sm text-on-surface-variant mb-stack-md">
          Everything in Karsa lives only in this browser's localStorage — clearing browser data or switching
          browsers means losing it all. Download a backup file periodically, or restore from one. Your Anthropic
          API key is never included in the backup file for safety.
        </p>

        <div className="flex items-center gap-stack-md flex-wrap">
          <RetroButton type="button" icon="download" onClick={downloadBackup}>
            Download Backup
          </RetroButton>

          <label className="btn-retro bg-surface text-primary font-label-caps text-label-caps py-2 px-4 flex items-center justify-center gap-2 uppercase tracking-wide cursor-pointer">
            <span className="material-symbols-outlined text-[18px]">upload_file</span>
            {backupStatus.state === 'busy' ? 'Restoring...' : 'Restore from File'}
            <input type="file" accept="application/json" className="hidden" onChange={handleImportBackup} disabled={backupStatus.state === 'busy'} />
          </label>
        </div>

        {backupStatus.message && (
          <p
            className={`font-body-sm text-body-sm mt-stack-md ${
              backupStatus.state === 'error' ? 'text-secondary' : 'text-tertiary-container'
            }`}
          >
            {backupStatus.message}
          </p>
        )}
      </BentoCard>
    </div>
  )
}
