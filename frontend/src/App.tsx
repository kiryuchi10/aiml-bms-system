import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './layout/AppShell'
import { MonitoringPage } from './pages/MonitoringPage'
import { BMSDashboardLive } from './pages/BMSDashboardLive'
import { ConfigurationPage } from './pages/ConfigurationPage'
import { LifetimeLogPage } from './pages/LifetimeLogPage'
import { LearningsBackupPage } from './pages/LearningsBackupPage'
import { TrainingResultsPage } from './pages/TrainingResultsPage'

export default function App() {
  return (
    <Routes>
      <Route path="/bms/live" element={<BMSDashboardLive />} />
      <Route path="/" element={<Navigate to="/bms/monitoring" replace />} />
      <Route
        path="/*"
        element={
          <AppShell>
            <Routes>
              <Route path="/bms/monitoring" element={<MonitoringPage />} />
              <Route path="/bms/configuration" element={<ConfigurationPage />} />
              <Route path="/bms/lifetime" element={<LifetimeLogPage />} />
              <Route path="/bms/learnings" element={<LearningsBackupPage />} />
              <Route path="/bms/training" element={<TrainingResultsPage />} />
            </Routes>
          </AppShell>
        }
      />
    </Routes>
  )
}

