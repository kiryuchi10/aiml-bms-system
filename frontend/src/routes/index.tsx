/**
 * Routes: /dashboard (PackOverview), /dashboard/fuel-gauge, /dashboard/safety, /dashboard/analytics, /dashboard/plot.
 */
import { Routes, Route, Navigate } from 'react-router-dom'
import { PackOverviewPage } from '../pages/PackOverview/PackOverviewPage'
import { FuelGaugePage } from '../pages/FuelGauge/FuelGaugePage'
import { SafetyPage } from '../pages/Safety/SafetyPage'
import { AnalyticsPage } from '../pages/Analytics/AnalyticsPage'
import { PlotPage } from '../pages/Analytics/PlotPage'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<PackOverviewPage />} />
      <Route path="/dashboard/fuel-gauge" element={<FuelGaugePage />} />
      <Route path="/dashboard/safety" element={<SafetyPage />} />
      <Route path="/dashboard/analytics" element={<AnalyticsPage />} />
      <Route path="/dashboard/plot" element={<PlotPage />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
