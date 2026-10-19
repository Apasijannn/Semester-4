import { createContext, useContext, useMemo, useState } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { createId } from '../utils/id'
import { sendMessage } from '../utils/anthropic'
import { formatCurrency } from '../utils/format'
import { TaskContext } from './TaskContext'
import { HealthContext } from './HealthContext'
import { ExerciseContext } from './ExerciseContext'
import { FinanceContext } from './FinanceContext'
import { SettingsContext } from './SettingsContext'

export const ChatContext = createContext(null)

const WELCOME_MESSAGE = {
  id: 'welcome',
  role: 'assistant',
  content: 'System initialized. Ready to process your requests. What are we building today?',
  timestamp: Date.now(),
}

function buildSystemPrompt({ tasks, health, exercise, finance }) {
  const pending = tasks.tasks.filter((t) => t.status !== 'done')
  const pendingList = pending.slice(0, 5).map((t) => `- ${t.title} (${t.priority})`).join('\n') || 'None'
  const recentTx = finance.transactions
    .slice(0, 5)
    .map((t) => `- ${t.type === 'income' ? '+' : '-'}${formatCurrency(t.amount)} ${t.category}`)
    .join('\n')

  const todayExercises = exercise.todayLog?.exercises || []
  const exerciseSummary = todayExercises.length
    ? `${todayExercises.filter((e) => e.completed).length}/${todayExercises.length} done today: ${todayExercises.map((e) => e.name).join(', ')}`
    : 'No recommendation generated yet today'

  return `You are Karsa, a personal assistant embedded in the user's "Karsa" productivity app (retro hand-drawn bento aesthetic). Give short, grounded, practical suggestions using the live data below. Do not invent data not listed here.

TASKS (${pending.length} pending):
${pendingList}

HEALTH:
- Current streak: ${health.streak} day(s)
- Today: sleep ${health.todayLog.sleepHours || 0}h, water ${health.todayLog.waterGlasses || 0}/8 glasses, exercised: ${health.todayLog.exercised ? 'yes' : 'no'}

EXERCISE:
- Current streak: ${exercise.streak} day(s)
- Today's plan: ${exerciseSummary}

FINANCE:
- Balance: ${formatCurrency(finance.balance)}
- Recent transactions:
${recentTx || 'None'}
`
}

export function ChatProvider({ children }) {
  const [messages, setMessages] = useLocalStorage('karsa_chat_messages', [WELCOME_MESSAGE])
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState(null)

  const tasks = useContext(TaskContext)
  const health = useContext(HealthContext)
  const exercise = useContext(ExerciseContext)
  const finance = useContext(FinanceContext)
  const settings = useContext(SettingsContext)

  const value = useMemo(() => {
    const clearChat = () => setMessages([WELCOME_MESSAGE])

    const sendUserMessage = async (content) => {
      const trimmed = content.trim()
      if (!trimmed) return

      const userMessage = { id: createId(), role: 'user', content: trimmed, timestamp: Date.now() }
      const nextMessages = [...messages, userMessage]
      setMessages(nextMessages)
      setError(null)

      if (!settings.apiKey) {
        setError('No Anthropic API key set yet. Add one in Settings to let Karsa reply.')
        return
      }

      setIsSending(true)
      try {
        const systemPrompt = buildSystemPrompt({ tasks, health, exercise, finance })
        const reply = await sendMessage({
          apiKey: settings.apiKey,
          model: settings.model,
          systemPrompt,
          messages: nextMessages
            .filter((m) => m.id !== 'welcome')
            .map((m) => ({ role: m.role, content: m.content })),
        })
        setMessages((prev) => [...prev, { id: createId(), role: 'assistant', content: reply, timestamp: Date.now() }])
      } catch (err) {
        setError(err.message || 'Something went wrong talking to Anthropic.')
      } finally {
        setIsSending(false)
      }
    }

    return { messages, sendUserMessage, clearChat, isSending, error, hasApiKey: Boolean(settings.apiKey) }
  }, [messages, setMessages, isSending, error, tasks, health, exercise, finance, settings])

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}
