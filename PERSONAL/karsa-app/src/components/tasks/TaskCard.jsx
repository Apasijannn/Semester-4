import { HandDrawnCheckbox } from '../ui/HandDrawnCheckbox'
import { WashiChip } from '../ui/WashiChip'
import { formatDueDate, isOverdue } from '../../utils/format'

export function TaskCard({ task, onToggle, onEdit, onDelete }) {
  const isDone = task.status === 'done'
  const overdue = task.dueDate && !isDone && isOverdue(task.dueDate)

  return (
    <div
      className={`brutal-border p-bento-padding hard-shadow relative transition-colors ${
        isDone ? 'bg-surface-container-high opacity-70' : 'bg-surface hover:bg-surface-container-low'
      }`}
    >
      {task.priority === 'urgent' && !isDone && (
        <div className="absolute top-4 right-4 stamp-effect text-secondary border-secondary px-2 py-1 font-label-caps text-label-caps font-black opacity-80">
          ASAP
        </div>
      )}

      <div className="flex items-start gap-stack-sm mb-stack-sm">
        <HandDrawnCheckbox checked={isDone} onChange={() => onToggle(task.id)} />
        <div className="flex-1">
          <h3 className={`font-headline-lg text-headline-lg leading-tight ${isDone ? 'line-through text-outline' : ''}`}>
            {task.title}
          </h3>
        </div>
      </div>

      {task.description && (
        <p className={`font-body-md text-body-md text-on-surface-variant ${isDone ? 'line-through' : ''}`}>
          {task.description}
        </p>
      )}

      {task.dueDate && (
        <p className={`font-label-caps text-label-caps mt-stack-sm ${overdue ? 'text-secondary' : 'text-on-surface-variant'}`}>
          {overdue ? 'OVERDUE' : 'DUE'}: {formatDueDate(task.dueDate)}
        </p>
      )}

      <div className="mt-stack-md flex justify-between items-center border-t-2 border-dashed border-outline-variant pt-stack-sm">
        <div className="flex gap-2 items-center">
          <WashiChip tone={isDone ? 'tertiary' : 'secondary'}>{isDone ? 'DONE' : task.category}</WashiChip>
          {task.source === 'its-classroom' && <WashiChip tone="tertiary">ITS</WashiChip>}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onEdit(task)}
            className="material-symbols-outlined text-outline hover:text-primary transition-colors"
          >
            edit_square
          </button>
          <button
            type="button"
            onClick={() => onDelete(task.id)}
            className="material-symbols-outlined text-outline hover:text-secondary transition-colors"
          >
            delete
          </button>
        </div>
      </div>
    </div>
  )
}
