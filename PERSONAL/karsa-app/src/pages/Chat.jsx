import { useEffect, useRef } from 'react'
import { useChat } from '../hooks/useChat'
import { ChatMessage } from '../components/chat/ChatMessage'
import { ChatInput } from '../components/chat/ChatInput'
import { ApiKeyPanel } from '../components/chat/ApiKeyPanel'

const QUICK_ACTIONS = [
  { icon: 'checklist', label: 'Summarize my tasks' },
  { icon: 'payments', label: 'How is my spending?' },
  { icon: 'monitor_heart', label: 'Health check-in' },
]

export function Chat() {
  const { messages, sendUserMessage, clearChat, isSending, error, hasApiKey } = useChat()
  const scrollRef = useRef(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, isSending])

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-4rem)] -m-grid-margin md:m-0">
      <div className="flex justify-between items-center px-grid-margin md:px-0 py-stack-sm md:py-0 md:mb-stack-md">
        <h2 className="font-headline-lg text-headline-lg font-bold text-primary">Karsa AI Chat</h2>
        <button
          type="button"
          onClick={clearChat}
          className="font-label-caps text-label-caps text-outline hover:text-secondary transition-colors"
        >
          CLEAR CHAT
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-grid-margin md:px-0 py-stack-md flex flex-col gap-stack-lg doodle-bg">
        {messages.map((m) => (
          <ChatMessage key={m.id} message={m} />
        ))}
        {isSending && (
          <div className="self-start p-stack-sm border-2 border-dashed border-primary bg-surface-variant flex gap-stack-sm items-center">
            <span className="material-symbols-outlined animate-spin">refresh</span>
            <span className="font-body-sm text-body-sm">Karsa is thinking...</span>
          </div>
        )}
      </div>

      <div className="p-stack-md border-t-4 border-primary bg-surface-container-low mx-[-2rem] md:mx-0 md:border-t-0 md:pt-stack-md flex flex-col gap-stack-md">
        {!hasApiKey && <ApiKeyPanel />}
        {error && <p className="font-body-sm text-body-sm text-secondary">{error}</p>}

        <div className="flex gap-stack-sm overflow-x-auto pb-1 scrollbar-hide">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={() => sendUserMessage(action.label)}
              disabled={isSending}
              className="wobbly-border bg-surface-container-highest text-primary px-3 py-1 font-label-caps text-label-caps shadow-[2px_2px_0px_0px_rgba(24,28,44,1)] hover:translate-y-[-2px] transition-all whitespace-nowrap disabled:opacity-50"
            >
              <span className="material-symbols-outlined align-bottom text-[16px] mr-1">{action.icon}</span>
              {action.label}
            </button>
          ))}
        </div>

        <ChatInput onSend={sendUserMessage} disabled={isSending} />
      </div>
    </div>
  )
}
