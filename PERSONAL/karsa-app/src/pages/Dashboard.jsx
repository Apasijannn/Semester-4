import { useNavigate } from 'react-router-dom'
import { useTasks } from '../hooks/useTasks'
import { useHealth } from '../hooks/useHealth'
import { useExercise } from '../hooks/useExercise'
import { useFinance } from '../hooks/useFinance'
import { useChat } from '../hooks/useChat'
import { HandDrawnCheckbox } from '../components/ui/HandDrawnCheckbox'
import { RetroButton } from '../components/ui/RetroButton'
import { WashiChip } from '../components/ui/WashiChip'
import { formatCurrency } from '../utils/format'

export function Dashboard() {
  const navigate = useNavigate()
  const { tasks, toggleDone } = useTasks()
  const { streak } = useHealth()
  const { todayLog: todayExerciseLog, streak: exerciseStreak } = useExercise()
  const { balance } = useFinance()
  const { messages } = useChat()

  const todayExercises = todayExerciseLog?.exercises || []
  const exercisesDone = todayExercises.filter((e) => e.completed).length

  const pendingTasks = tasks.filter((t) => t.status !== 'done')
  const urgentCount = pendingTasks.filter((t) => t.priority === 'urgent').length
  const previewTasks = tasks.slice(0, 4)
  const previewMessages = messages.slice(-2)

  const goToChat = (e) => {
    e.preventDefault()
    navigate('/chat')
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-grid-gutter">
      <div className="md:col-span-8 bg-surface-container-lowest brutal-border hard-shadow p-bento-padding flex flex-col justify-between relative overflow-hidden">
        <div className="absolute top-4 right-4 opacity-10">
          <span className="material-symbols-outlined text-[120px]">sunny</span>
        </div>
        <div>
          <span className="inline-block bg-primary-fixed text-on-primary-fixed px-2 py-1 font-label-caps text-label-caps border border-primary transform -rotate-2 mb-4">
            LOG_ENTRY
          </span>
          <h2 className="font-headline-xl text-headline-xl text-primary mb-2">Good to see you, Karsa.</h2>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-md">
            You have {pendingTasks.length} task{pendingTasks.length === 1 ? '' : 's'} pending and a {streak}-day
            health streak. Balance is currently {formatCurrency(balance)}.
          </p>
        </div>
        <div className="mt-6">
          <RetroButton onClick={() => navigate('/tasks')}>VIEW TASKS</RetroButton>
        </div>
      </div>

      <div className="md:col-span-4 bg-error-container brutal-border hard-shadow p-bento-padding flex flex-col justify-between scribble-bg-secondary">
        <div className="flex justify-between items-start mb-4">
          <span className="font-label-caps text-label-caps text-on-error-container uppercase tracking-widest bg-surface px-2 py-1 brutal-border">
            TASKS_DUE
          </span>
          <span className="material-symbols-outlined text-secondary text-3xl">priority_high</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-headline-xl text-headline-xl text-on-error-container">{pendingTasks.length}</span>
          <span className="font-body-sm text-body-sm text-on-secondary-container">{urgentCount} High Priority</span>
        </div>
        <p className="font-label-caps text-label-caps text-secondary mt-4 bg-surface-container-lowest inline-block px-2 py-1 border-b-2 border-secondary self-start">
          {urgentCount > 0 ? 'Review needed' : 'All clear'}
        </p>
      </div>

      <div
        className="md:col-span-12 bg-tertiary-container text-on-tertiary-container brutal-border hard-shadow p-bento-padding flex items-center justify-between flex-wrap gap-stack-md cursor-pointer hover:bg-tertiary-fixed transition-colors"
        onClick={() => navigate('/health')}
      >
        <div className="flex items-center gap-stack-md">
          <span className="material-symbols-outlined text-4xl">directions_run</span>
          <div>
            <span className="font-label-caps text-label-caps uppercase tracking-widest">MODULE_EXERCISE</span>
            <p className="font-body-md text-body-md mt-1">
              {todayExercises.length > 0
                ? `${exercisesDone} of ${todayExercises.length} exercises done today`
                : 'No recommendation generated yet today'}
            </p>
          </div>
        </div>
        <span className="font-headline-lg text-headline-lg font-bold">{exerciseStreak}-day streak</span>
      </div>

      <div className="md:col-span-6 bg-surface brutal-border hard-shadow p-bento-padding">
        <div className="flex justify-between items-center mb-6 border-b-4 border-primary pb-2">
          <h3 className="font-headline-lg text-headline-lg text-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-primary-container text-4xl">checklist</span>
            Current Tasks
          </h3>
          <span className="bg-primary-fixed text-on-primary-fixed font-label-caps text-label-caps px-2 py-1 brutal-border">
            MODULE_T
          </span>
        </div>
        {previewTasks.length === 0 ? (
          <p className="font-body-md text-body-md text-on-surface-variant italic">No tasks yet — add one to get started.</p>
        ) : (
          <ul className="flex flex-col gap-4">
            {previewTasks.map((task) => (
              <li key={task.id} className="flex items-center gap-4 p-3 bg-surface-container-lowest brutal-border">
                <HandDrawnCheckbox checked={task.status === 'done'} onChange={() => toggleDone(task.id)} />
                <span
                  className={`flex-1 font-body-md text-body-md ${
                    task.status === 'done' ? 'text-outline line-through' : 'font-bold'
                  }`}
                >
                  {task.title}
                </span>
                <WashiChip tone={task.status === 'done' ? 'tertiary' : 'secondary'}>
                  {task.status === 'done' ? 'DONE' : task.priority === 'urgent' ? 'URGENT' : task.category}
                </WashiChip>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="md:col-span-6 bg-surface-container-low brutal-border hard-shadow p-bento-padding flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-headline-lg text-headline-lg text-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary-container text-4xl">smart_toy</span>
            Karsa AI
          </h3>
          <span className="bg-secondary-fixed text-on-secondary-fixed font-label-caps text-label-caps px-2 py-1 brutal-border">
            AWAITING_INPUT
          </span>
        </div>
        <div className="flex-1 bg-surface brutal-border p-4 mb-4 flex flex-col gap-4 overflow-y-auto scribble-bg-tertiary max-h-64">
          {previewMessages.map((m) => (
            <div key={m.id} className={`flex gap-3 max-w-[85%] ${m.role === 'user' ? 'self-end flex-row-reverse' : ''}`}>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  m.role === 'user' ? 'border-2 border-primary bg-secondary-container' : 'bg-primary'
                }`}
              >
                <span className={`material-symbols-outlined text-sm ${m.role === 'user' ? 'text-primary' : 'text-on-primary'}`}>
                  {m.role === 'user' ? 'face' : 'smart_toy'}
                </span>
              </div>
              <div
                className={`p-3 brutal-border text-sm ${
                  m.role === 'user' ? 'bg-tertiary-fixed text-on-tertiary-fixed rounded-tl-xl rounded-b-xl text-right' : 'bg-surface-container rounded-tr-xl rounded-b-xl'
                }`}
              >
                <p className="font-body-sm text-body-sm">{m.content}</p>
              </div>
            </div>
          ))}
        </div>
        <form className="relative" onSubmit={goToChat}>
          <input
            className="w-full bg-surface-container-lowest brutal-border p-3 font-body-md text-body-md focus:outline-none focus:border-secondary border-b-4 placeholder-outline-variant pr-12"
            placeholder="Query system... (opens Chat)"
            readOnly
            onClick={() => navigate('/chat')}
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary text-on-primary w-8 h-8 flex items-center justify-center brutal-border hover:bg-secondary hover:text-on-secondary transition-colors"
          >
            <span className="material-symbols-outlined text-sm">send</span>
          </button>
        </form>
      </div>
    </div>
  )
}
