import { formatTime } from '../../utils/format'

export function ChatMessage({ message }) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex gap-stack-md max-w-3xl ${isUser ? 'self-end flex-row-reverse' : 'self-start'}`}>
      <div
        className={`w-10 h-10 shrink-0 wobbly-border flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(24,28,44,1)] ${
          isUser ? 'bg-secondary-container' : 'bg-tertiary-fixed-dim'
        }`}
      >
        <span className="material-symbols-outlined text-primary">{isUser ? 'face' : 'smart_toy'}</span>
      </div>
      <div className={`flex flex-col gap-stack-xs ${isUser ? 'items-end' : ''}`}>
        <span className="font-label-caps text-label-caps text-on-surface-variant">
          {isUser ? 'USER' : 'KARSA'} &middot; {formatTime(message.timestamp)}
        </span>
        <div
          className={`wobbly-border p-stack-md shadow-[4px_4px_0px_0px_rgba(24,28,44,1)] relative whitespace-pre-wrap ${
            isUser ? 'bg-secondary-fixed text-on-secondary-fixed' : 'bg-surface-container-lowest'
          }`}
        >
          <p className="font-body-md text-body-md">{message.content}</p>
        </div>
      </div>
    </div>
  )
}
