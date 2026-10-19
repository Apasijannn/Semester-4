import { BentoCard } from '../ui/BentoCard'
import { HandDrawnCheckbox } from '../ui/HandDrawnCheckbox'

const MEALS = [
  { key: 'breakfast', label: 'Breakfast' },
  { key: 'lunch', label: 'Lunch' },
  { key: 'dinner', label: 'Dinner' },
]

export function NutritionCard({ meals, onToggleMeal }) {
  return (
    <BentoCard className="md:col-span-3 flex flex-col interactive" interactive>
      <div className="flex justify-between items-start mb-4">
        <span className="font-label-caps text-label-caps text-on-surface-variant">NUTRITION</span>
        <span className="material-symbols-outlined text-primary">restaurant</span>
      </div>
      <ul className="flex flex-col gap-3 font-body-sm text-body-sm">
        {MEALS.map((meal) => (
          <li key={meal.key} className="flex items-center gap-2">
            <HandDrawnCheckbox
              checked={Boolean(meals[meal.key])}
              onChange={() => onToggleMeal(meal.key)}
              className="w-5 h-5"
            />
            <span className={meals[meal.key] ? 'line-through text-outline' : ''}>{meal.label}</span>
          </li>
        ))}
      </ul>
    </BentoCard>
  )
}
