import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './layout/AppShell'
import { MonitoringPage } from './pages/MonitoringPage'
import { BMSDashboardLive } from './pages/BMSDashboardLive'
import { DashboardPage } from './pages/DashboardPage'
import DashboardHome from './pages/Dashboard/DashboardHome'
import { CellsGridPage } from './pages/CellsGridPage'
import { RealtimeMonitorPage } from './pages/RealtimeMonitorPage'
import { AnalyticsPage } from './pages/AnalyticsPage'
import { AlarmCenterPage } from './pages/AlarmCenterPage'
import { MLConsolePage } from './pages/MLConsolePage'
import { ConfigurationPage } from './pages/ConfigurationPage'
import { LifetimeLogPage } from './pages/LifetimeLogPage'
import { LearningsBackupPage } from './pages/LearningsBackupPage'
import { TrainingResultsPage } from './pages/TrainingResultsPage'

export default function App() {
  return (
    <Routes>
      <Route path="/bms/live" element={<BMSDashboardLive />} />
      <Route path="/bms/dashboard" element={<DashboardPage />} />
      <Route path="/" element={<Navigate to="/bms/home" replace />} />
      <Route
        path="/*"
        element={
          <AppShell>
            <Routes>
              <Route path="/bms/home" element={<DashboardHome />} />
              <Route path="/bms/cells" element={<CellsGridPage />} />
              <Route path="/bms/realtime" element={<RealtimeMonitorPage />} />
              <Route path="/bms/analytics" element={<AnalyticsPage />} />
              <Route path="/bms/alarms" element={<AlarmCenterPage />} />
              <Route path="/bms/ml" element={<MLConsolePage />} />
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

