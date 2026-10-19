import { SettingsProvider } from './SettingsContext'
import { TaskProvider } from './TaskContext'
import { HealthProvider } from './HealthContext'
import { ExerciseProvider } from './ExerciseContext'
import { FinanceProvider } from './FinanceContext'
import { ChatProvider } from './ChatContext'

export function AppProviders({ children }) {
  return (
    <SettingsProvider>
      <TaskProvider>
        <HealthProvider>
          <ExerciseProvider>
            <FinanceProvider>
              <ChatProvider>{children}</ChatProvider>
            </FinanceProvider>
          </ExerciseProvider>
        </HealthProvider>
      </TaskProvider>
    </SettingsProvider>
  )
}
