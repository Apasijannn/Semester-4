import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppProviders } from './context/AppProviders'
import { AppLayout } from './components/layout/AppLayout'
import { Dashboard } from './pages/Dashboard'
import { Tasks } from './pages/Tasks'
import { Health } from './pages/Health'
import { Finance } from './pages/Finance'
import { Chat } from './pages/Chat'
import { Settings } from './pages/Settings'

function App() {
  return (
    <BrowserRouter>
      <AppProviders>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/health" element={<Health />} />
            <Route path="/finance" element={<Finance />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </AppProviders>
    </BrowserRouter>
  )
}

export default App
