import { BentoCard } from '../ui/BentoCard'
import { HYDRATION_GOAL_GLASSES as GOAL_GLASSES } from '../../utils/healthGoals'

export function HydrationCard({ waterGlasses, onChange }) {
  return (
    <BentoCard className="md:col-span-3 flex flex-col interactive bg-surface-container-low" interactive>
      <div className="flex justify-between items-start mb-4">
        <span className="font-label-caps text-label-caps text-on-surface-variant">HYDRATION</span>
        <span className="material-symbols-outlined text-primary">water_drop</span>
      </div>
      <div className="flex-1 flex flex-col justify-center items-center">
        <div className="font-headline-lg text-headline-lg text-primary text-center">
          {waterGlasses} / {GOAL_GLASSES}
        </div>
        <div className="font-body-sm text-body-sm text-outline mt-1 text-center">Glasses</div>
        <div className="flex gap-1 mt-4">
          {Array.from({ length: GOAL_GLASSES }).map((_, i) => (
            <span
              key={i}
              className={`material-symbols-outlined ${i < waterGlasses ? 'text-tertiary-fixed-dim' : 'text-outline-variant'}`}
              style={{ fontVariationSettings: i < waterGlasses ? "'FILL' 1" : "'FILL' 0" }}
            >
              water_drop
            </span>
          ))}
        </div>
        <div className="flex gap-2 mt-4">
          <button
            type="button"
            onClick={() => onChange(Math.max(0, waterGlasses - 1))}
            className="brutal-border w-8 h-8 flex items-center justify-center bg-surface hover:bg-surface-variant"
          >
            -
          </button>
          <button
            type="button"
            onClick={() => onChange(waterGlasses + 1)}
            className="brutal-border w-8 h-8 flex items-center justify-center bg-primary text-on-primary"
          >
            +
          </button>
        </div>
      </div>
    </BentoCard>
  )
}
