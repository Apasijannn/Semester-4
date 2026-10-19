import { BentoCard } from '../ui/BentoCard'

export function WeeklyActivityChart({ weeklyActivity, exercised, onToggleExercise }) {
  return (
    <BentoCard className="md:col-span-8 flex flex-col interactive min-h-[250px]" interactive>
      <div className="flex justify-between items-start mb-6">
        <span className="font-label-caps text-label-caps text-on-surface-variant">WEEKLY_ACTIVITY</span>
        <button
          type="button"
          onClick={onToggleExercise}
          className={`flex items-center gap-1 font-label-caps text-label-caps px-2 py-1 border-2 border-primary transition-colors ${
            exercised ? 'bg-tertiary-fixed-dim text-primary' : 'bg-surface text-on-surface-variant'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">directions_run</span>
          {exercised ? 'EXERCISED' : 'MARK EXERCISE'}
        </button>
      </div>
      <div className="flex-1 flex items-end justify-between gap-2 px-4 pb-2 border-b-2 border-primary relative">
        {weeklyActivity.map((day) => (
          <div key={day.date} className="flex flex-col items-center gap-2 w-full h-full justify-end">
            <div
              className={`hand-drawn-bar w-8 md:w-12 ${day.level >= 80 ? 'bg-tertiary-fixed-dim' : 'bg-surface'}`}
              style={{ height: `${Math.max(day.level, 4)}%` }}
            />
            <span className="font-label-caps text-label-caps text-[10px]">{day.label}</span>
          </div>
        ))}
      </div>
    </BentoCard>
  )
}
