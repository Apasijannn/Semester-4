import { BentoCard } from '../ui/BentoCard'
import { SLEEP_GOAL_HOURS } from '../../utils/healthGoals'

export function SleepCard({ sleepHours, onChange }) {
  const pct = Math.min(100, Math.round((sleepHours / SLEEP_GOAL_HOURS) * 100))

  return (
    <BentoCard className="md:col-span-3 flex flex-col interactive" interactive>
      <div className="flex justify-between items-start mb-4">
        <span className="font-label-caps text-label-caps text-on-surface-variant">SLEEP_LOG</span>
        <span className="material-symbols-outlined text-primary">bedtime</span>
      </div>
      <div className="flex-1 flex flex-col justify-center">
        <div className="flex items-baseline gap-2">
          <input
            type="number"
            min="0"
            max="24"
            step="0.5"
            value={sleepHours}
            onChange={(e) => onChange(Number(e.target.value))}
            className="terminal-input font-headline-lg text-headline-lg text-primary w-20 py-0"
          />
          <span className="font-body-sm text-body-sm text-outline">hours</span>
        </div>
        <div className="font-body-sm text-body-sm text-outline mt-1">Goal: {SLEEP_GOAL_HOURS}h</div>
        <div className="mt-4 w-full h-2 bg-surface-variant border border-primary rounded-full overflow-hidden">
          <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </BentoCard>
  )
}
