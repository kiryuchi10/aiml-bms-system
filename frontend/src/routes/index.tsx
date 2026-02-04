/**
 * Route table: /dashboard (Battery pack), /dashboard/fleet, /dashboard/vehicle/:id, /dashboard/trips, /dashboard/research.
 */
import { Route, Routes, Navigate } from 'react-router-dom'
import { Shell } from '../components/layout/Shell'
import { DashboardHome } from '../pages/Dashboard/DashboardHome'
import { FleetOverview } from '../pages/Dashboard/FleetOverview'
import { VehicleDetail } from '../pages/Dashboard/VehicleDetail'
import { TripExplorer } from '../pages/Dashboard/TripExplorer'
import { ResearchMode } from '../pages/Dashboard/ResearchMode'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<Shell />}>
        <Route index element={<DashboardHome />} />
        <Route path="fleet" element={<FleetOverview />} />
        <Route path="vehicle/:id" element={<VehicleDetail />} />
        <Route path="trips" element={<TripExplorer />} />
        <Route path="research" element={<ResearchMode />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
