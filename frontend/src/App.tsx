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
import { UIGalleryPage } from './pages/UIGalleryPage'
import { Layout3PanelOpsPage } from './pages/ui_gallery/Layout3PanelOpsPage'
import { LayoutControlRoomWallPage } from './pages/ui_gallery/LayoutControlRoomWallPage'
import { LayoutExecutiveCardsPage } from './pages/ui_gallery/LayoutExecutiveCardsPage'
import { LayoutDrilldownMapPage } from './pages/ui_gallery/LayoutDrilldownMapPage'
import { LayoutChronologicalPlaybackPage } from './pages/ui_gallery/LayoutChronologicalPlaybackPage'
import { LayoutAlarmDrivenPage } from './pages/ui_gallery/LayoutAlarmDrivenPage'
import { LayoutChargingStationPage } from './pages/ui_gallery/LayoutChargingStationPage'
import { LayoutThermalEngineerPage } from './pages/ui_gallery/LayoutThermalEngineerPage'
import { LayoutBalancingViewPage } from './pages/ui_gallery/LayoutBalancingViewPage'
import { LayoutMLOpsViewPage } from './pages/ui_gallery/LayoutMLOpsViewPage'
import { LayoutFleetOverviewPage } from './pages/ui_gallery/LayoutFleetOverviewPage'
import { LayoutMinimalIndustrialPage } from './pages/ui_gallery/LayoutMinimalIndustrialPage'

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
              <Route path="/bms/ui" element={<UIGalleryPage />} />
              <Route path="/bms/ui/layout-3panel-ops" element={<Layout3PanelOpsPage />} />
              <Route path="/bms/ui/layout-control-room-wall" element={<LayoutControlRoomWallPage />} />
              <Route path="/bms/ui/layout-executive-cards" element={<LayoutExecutiveCardsPage />} />
              <Route path="/bms/ui/layout-drilldown-map" element={<LayoutDrilldownMapPage />} />
              <Route path="/bms/ui/layout-chronological-playback" element={<LayoutChronologicalPlaybackPage />} />
              <Route path="/bms/ui/layout-alarm-driven" element={<LayoutAlarmDrivenPage />} />
              <Route path="/bms/ui/layout-charging-station" element={<LayoutChargingStationPage />} />
              <Route path="/bms/ui/layout-thermal-engineer" element={<LayoutThermalEngineerPage />} />
              <Route path="/bms/ui/layout-balancing-view" element={<LayoutBalancingViewPage />} />
              <Route path="/bms/ui/layout-mlops-view" element={<LayoutMLOpsViewPage />} />
              <Route path="/bms/ui/layout-fleet-overview" element={<LayoutFleetOverviewPage />} />
              <Route path="/bms/ui/layout-minimal-industrial" element={<LayoutMinimalIndustrialPage />} />
            </Routes>
          </AppShell>
        }
      />
    </Routes>
  )
}

