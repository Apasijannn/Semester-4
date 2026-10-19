import { BentoCard } from '../ui/BentoCard'

export function StreakCounter({ streak }) {
  const marks = Array.from({ length: Math.min(streak, 10) })

  return (
    <BentoCard className="md:col-span-4 flex flex-col justify-between interactive min-h-[200px]" interactive>
      <div className="flex justify-between items-start">
        <span className="font-label-caps text-label-caps text-on-surface-variant">HABIT_STREAK</span>
        <span className="material-symbols-outlined text-tertiary-fixed-dim">local_fire_department</span>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center mt-4">
        <div className="flex gap-1 flex-wrap justify-center max-w-[180px]">
          {marks.length === 0 ? (
            <span className="font-body-sm text-body-sm text-outline">Log today to start a streak.</span>
          ) : (
            marks.map((_, i) => (
              <div
                key={i}
                className="w-1 h-8 bg-primary rounded"
                style={{ transform: `rotate(${(i % 2 === 0 ? -1 : 1) * (4 + (i % 3))}deg)` }}
              />
            ))
          )}
        </div>
        <div className="font-headline-lg text-headline-lg text-primary mt-4">{streak} Day{streak === 1 ? '' : 's'}</div>
      </div>
    </BentoCard>
  )
}
