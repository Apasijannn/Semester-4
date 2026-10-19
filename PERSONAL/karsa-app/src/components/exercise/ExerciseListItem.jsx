import { HandDrawnCheckbox } from '../ui/HandDrawnCheckbox'

const INTENSITY_STYLES = {
  ringan: 'bg-tertiary-container text-on-tertiary-container border-tertiary-container',
  sedang: 'bg-[#fef08a] text-primary border-primary',
  berat: 'bg-error-container text-on-error-container border-error',
}

export function ExerciseListItem({ exercise, onToggle }) {
  const meta = [exercise.duration ? `${exercise.duration} menit` : null, exercise.reps, exercise.category]
    .filter(Boolean)
    .join(' · ')

  return (
    <li
      className={`flex items-center gap-stack-md p-stack-sm brutal-border transition-colors ${
        exercise.completed ? 'bg-surface-container-high opacity-70' : 'bg-surface'
      }`}
    >
      <HandDrawnCheckbox checked={exercise.completed} onChange={() => onToggle(exercise.id)} />
      <div className="flex-1">
        <p className={`font-body-md text-body-md font-bold ${exercise.completed ? 'line-through text-outline' : 'text-primary'}`}>
          {exercise.name}
        </p>
        {meta && <p className="font-label-caps text-[10px] text-on-surface-variant mt-1">{meta}</p>}
      </div>
      <span
        className={`px-2 py-1 font-label-caps text-[10px] border-2 uppercase shrink-0 ${
          INTENSITY_STYLES[exercise.intensity] || INTENSITY_STYLES.sedang
        }`}
      >
        {exercise.intensity}
      </span>
    </li>
  )
}
