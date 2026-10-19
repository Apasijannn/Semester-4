import { createContext, useMemo } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { createId } from '../utils/id'

export const TaskContext = createContext(null)

const SEED_TASKS = [
  {
    id: createId(),
    title: 'Fix Auth Core Dump',
    description: 'System is rejecting valid tokens. Check the redis cache configuration.',
    category: 'BUG',
    priority: 'urgent',
    status: 'todo',
    createdAt: Date.now(),
  },
  {
    id: createId(),
    title: 'Draft UI Specs',
    description: 'Compile the final brutalist design tokens for the new dashboard view.',
    category: 'DESIGN',
    priority: 'normal',
    status: 'todo',
    createdAt: Date.now(),
  },
  {
    id: createId(),
    title: 'Weekly Sync',
    description: 'Review sprint goals with the engineering team.',
    category: 'MEETING',
    priority: 'normal',
    status: 'done',
    createdAt: Date.now(),
  },
]

export function TaskProvider({ children }) {
  const [tasks, setTasks] = useLocalStorage('karsa_tasks', SEED_TASKS)

  const value = useMemo(() => {
    const addTask = (task) => {
      setTasks((prev) => [
        {
          id: createId(),
          title: task.title,
          description: task.description || '',
          category: task.category || 'GENERAL',
          priority: task.priority || 'normal',
          status: 'todo',
          createdAt: Date.now(),
          dueDate: task.dueDate || null,
          source: task.source || 'manual',
          externalId: task.externalId || null,
        },
        ...prev,
      ])
    }

    const importTasks = (events) => {
      let added = 0
      let updated = 0
      const next = [...tasks]

      events.forEach((event) => {
        const existingIndex = next.findIndex((t) => t.externalId === event.uid)
        if (existingIndex === -1) {
          next.unshift({
            id: createId(),
            title: event.title,
            description: event.description || '',
            category: 'ASSIGNMENT',
            priority: 'normal',
            status: 'todo',
            createdAt: Date.now(),
            dueDate: event.start,
            source: 'its-classroom',
            externalId: event.uid,
          })
          added += 1
        } else {
          const existing = next[existingIndex]
          const changed =
            existing.title !== event.title ||
            existing.description !== (event.description || '') ||
            existing.dueDate !== event.start
          if (changed) {
            next[existingIndex] = {
              ...existing,
              title: event.title,
              description: event.description || '',
              dueDate: event.start,
            }
            updated += 1
          }
        }
      })

      if (added > 0 || updated > 0) {
        setTasks(next)
      }

      return { added, updated }
    }

    const updateTask = (id, updates) => {
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)))
    }

    const deleteTask = (id) => {
      setTasks((prev) => prev.filter((t) => t.id !== id))
    }

    const toggleDone = (id) => {
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status: t.status === 'done' ? 'todo' : 'done' } : t)),
      )
    }

    return { tasks, addTask, updateTask, deleteTask, toggleDone, importTasks }
  }, [tasks, setTasks])

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>
}
