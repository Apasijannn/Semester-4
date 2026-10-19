import { useMemo, useState } from 'react'
import { useTasks } from '../hooks/useTasks'
import { TaskCard } from '../components/tasks/TaskCard'
import { TaskForm } from '../components/tasks/TaskForm'
import { TaskFilters } from '../components/tasks/TaskFilters'
import { RetroButton } from '../components/ui/RetroButton'

export function Tasks() {
  const { tasks, addTask, updateTask, deleteTask, toggleDone } = useTasks()
  const [filter, setFilter] = useState('all')
  const [formOpen, setFormOpen] = useState(false)
  const [editingTask, setEditingTask] = useState(null)

  const filteredTasks = useMemo(() => {
    let result
    switch (filter) {
      case 'todo':
        result = tasks.filter((t) => t.status !== 'done')
        break
      case 'done':
        result = tasks.filter((t) => t.status === 'done')
        break
      case 'urgent':
        result = tasks.filter((t) => t.priority === 'urgent' && t.status !== 'done')
        break
      default:
        result = tasks
    }

    return [...result].sort((a, b) => {
      if (a.dueDate && b.dueDate) return new Date(a.dueDate) - new Date(b.dueDate)
      if (a.dueDate) return -1
      if (b.dueDate) return 1
      return 0
    })
  }, [tasks, filter])

  const openNewTaskForm = () => {
    setEditingTask(null)
    setFormOpen(true)
  }

  const openEditForm = (task) => {
    setEditingTask(task)
    setFormOpen(true)
  }

  const handleSubmit = (values) => {
    if (editingTask) {
      updateTask(editingTask.id, values)
    } else {
      addTask(values)
    }
  }

  return (
    <div>
      <header className="flex justify-between items-end mb-stack-lg border-b-4 border-primary pb-stack-sm border-dashed flex-wrap gap-stack-md">
        <div>
          <h2 className="font-headline-xl text-headline-xl text-primary font-black tracking-tighter">
            CURRENT_TASKS<span className="blinking-cursor text-secondary"></span>
          </h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-2">
            {tasks.filter((t) => t.status !== 'done').length} pending &middot; {tasks.filter((t) => t.status === 'done').length} done
          </p>
        </div>
        <div className="flex items-center gap-stack-md flex-wrap">
          <TaskFilters active={filter} onChange={setFilter} />
          <RetroButton icon="add" onClick={openNewTaskForm}>
            New Task
          </RetroButton>
        </div>
      </header>

      {filteredTasks.length === 0 ? (
        <p className="font-body-md text-body-md text-on-surface-variant italic">No tasks in this view yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-grid-gutter">
          {filteredTasks.map((task) => (
            <TaskCard key={task.id} task={task} onToggle={toggleDone} onEdit={openEditForm} onDelete={deleteTask} />
          ))}
        </div>
      )}

      <TaskForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
        initialTask={editingTask}
      />

      <button
        type="button"
        onClick={openNewTaskForm}
        className="fixed bottom-24 md:bottom-grid-margin right-grid-margin z-30 bg-secondary text-on-secondary border-4 border-primary w-16 h-16 rounded-full flex items-center justify-center hard-shadow hard-shadow-hover hard-shadow-active transition-all"
      >
        <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
          add
        </span>
      </button>
    </div>
  )
}
