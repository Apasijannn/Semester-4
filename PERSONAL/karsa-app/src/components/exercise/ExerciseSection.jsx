import { useEffect, useRef } from 'react'
import { useExercise } from '../../hooks/useExercise'
import { RetroButton } from '../ui/RetroButton'
import { ExerciseListItem } from './ExerciseListItem'

export function ExerciseSection() {
  const { todayLog, toggleExerciseDone, generateToday, status, streak, weeklyHistory } = useExercise()
  const hasAutoRun = useRef(false)

  useEffect(() => {
    if (hasAutoRun.current) return
    hasAutoRun.current = true
    generateToday(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const isLoading = status === 'loading'
  const exercises = todayLog?.exercises || []
  const completedCount = exercises.filter((e) => e.completed).length
  const total = exercises.length
  const pct = total > 0 ? Math.round((completedCount / total) * 100) : 0

  return (
    <div className="mt-grid-gutter">
      <div className="flex justify-between items-end mb-stack-md border-b-2 border-primary pb-stack-sm border-dashed flex-wrap gap-stack-sm">
        <div>
          <h2 className="font-headline-xl text-headline-xl text-primary">Exercise</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">Rekomendasi olahraga hari ini</p>
        </div>
        <RetroButton type="button" icon="refresh" onClick={() => generateToday(true)} disabled={isLoading}>
          {isLoading ? 'Menyusun rekomendasi...' : 'Generate Ulang'}
        </RetroButton>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-grid-gutter">
        <div className="md:col-span-8 bento-card p-bento-padding">
          {isLoading && exercises.length === 0 ? (
            <p className="font-body-md text-body-md text-on-surface-variant italic">Menyusun rekomendasi...</p>
          ) : exercises.length === 0 ? (
            <p className="font-body-md text-body-md text-on-surface-variant italic">Belum ada rekomendasi hari ini.</p>
          ) : (
            <>
              <ul className="flex flex-col gap-stack-sm">
                {exercises.map((ex) => (
                  <ExerciseListItem key={ex.id} exercise={ex} onToggle={toggleExerciseDone} />
                ))}
              </ul>

              {todayLog?.source === 'fallback' && (
                <p className="font-label-caps text-[10px] text-secondary mt-stack-md">
                  Rekomendasi AI tidak tersedia, ini alternatif umum.
                </p>
              )}

              <div className="mt-stack-md">
                <p className="font-label-caps text-label-caps text-on-surface-variant mb-1">
                  {completedCount} dari {total} exercise selesai hari ini
                </p>
                <div className="w-full h-2 bg-surface-variant border border-primary rounded-full overflow-hidden">
                  <div className="h-full bg-tertiary-fixed-dim transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div>
            </>
          )}
        </div>

        <div className="md:col-span-4 sticky-note p-bento-padding flex flex-col justify-center items-center">
          <p className="font-headline-lg-mobile text-headline-lg-mobile text-primary text-center leading-tight">
            {todayLog?.motivation || 'Yuk mulai gerak sedikit hari ini!'}
          </p>
          <div className="mt-4 font-label-caps text-label-caps text-on-surface-variant self-end">
            {todayLog?.source === 'ai' ? '- Karsa AI' : '- Management'}
          </div>
        </div>

        <div className="md:col-span-12 bento-card p-bento-padding">
          <div className="flex justify-between items-center mb-stack-sm">
            <span className="font-label-caps text-label-caps text-on-surface-variant">EXERCISE_STREAK</span>
            <span className="font-headline-lg text-headline-lg text-primary">{streak} Hari</span>
          </div>
          <div className="grid grid-cols-7 gap-stack-sm">
            {weeklyHistory.map((day) => (
              <div
                key={day.date}
                className={`p-2 text-center brutal-border ${
                  day.completed ? 'bg-tertiary-fixed-dim' : 'bg-surface opacity-50'
                }`}
              >
                <div className="font-label-caps text-[10px]">{day.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
