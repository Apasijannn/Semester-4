import { useState } from 'react'

export function ChatInput({ onSend, disabled }) {
  const [value, setValue] = useState('')

  const submit = (e) => {
    e.preventDefault()
    if (!value.trim() || disabled) return
    onSend(value)
    setValue('')
  }

  return (
    <form onSubmit={submit} className="flex items-end gap-stack-md bg-surface p-stack-sm wobbly-border shadow-[4px_4px_0px_0px_rgba(24,28,44,1)]">
      <span className="font-headline-lg text-headline-lg text-secondary pl-2 mb-1">&gt;</span>
      <input
        className="flex-1 terminal-input font-body-md text-body-md py-2 px-1 focus:ring-0 placeholder:text-outline-variant"
        placeholder="Type a command or request..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={disabled}
      />
      <button
        type="submit"
        disabled={disabled || !value.trim()}
        className="wobbly-border bg-primary text-on-primary p-2 shadow-[2px_2px_0px_0px_rgba(183,24,73,1)] hover:bg-secondary transition-colors mb-1 disabled:opacity-40"
      >
        <span className="material-symbols-outlined block">send</span>
      </button>
    </form>
  )
}
