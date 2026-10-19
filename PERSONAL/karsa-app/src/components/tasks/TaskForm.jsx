import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { RetroButton } from '../ui/RetroButton'
import { TerminalInput } from '../ui/TerminalInput'

const CATEGORIES = ['GENERAL', 'WORK', 'BUG', 'DESIGN', 'MEETING', 'ASSIGNMENT']

export function TaskForm({ open, onClose, onSubmit, initialTask }) {
  const [title, setTitle] = useState(initialTask?.title || '')
  const [description, setDescription] = useState(initialTask?.description || '')
  const [category, setCategory] = useState(initialTask?.category || 'GENERAL')
  const [priority, setPriority] = useState(initialTask?.priority || 'normal')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!title.trim()) return
    onSubmit({ title: title.trim(), description: description.trim(), category, priority })
    setTitle('')
    setDescription('')
    setCategory('GENERAL')
    setPriority('normal')
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={initialTask ? 'Edit Task' : 'New Task'}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-stack-md">
        <label className="flex flex-col gap-1">
          <span className="font-label-caps text-label-caps text-on-surface-variant">Title</span>
          <TerminalInput value={title} onChange={(e) => setTitle(e.target.value)} autoFocus required />
        </label>

        <label className="flex flex-col gap-1">
          <span className="font-label-caps text-label-caps text-on-surface-variant">Description</span>
          <textarea
            className="terminal-input font-body-md text-body-md py-2 px-1 w-full focus:ring-0"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>

        <div className="flex gap-stack-md">
          <label className="flex-1 flex flex-col gap-1">
            <span className="font-label-caps text-label-caps text-on-surface-variant">Category</span>
            <select
              className="brutal-border bg-surface p-2 font-body-sm text-body-sm"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>

          <label className="flex-1 flex flex-col gap-1">
            <span className="font-label-caps text-label-caps text-on-surface-variant">Priority</span>
            <select
              className="brutal-border bg-surface p-2 font-body-sm text-body-sm"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              <option value="normal">Normal</option>
              <option value="urgent">Urgent</option>
            </select>
          </label>
        </div>

        <RetroButton type="submit" icon="save" className="self-start mt-stack-sm">
          {initialTask ? 'Save Changes' : 'Add Task'}
        </RetroButton>
      </form>
    </Modal>
  )
}
