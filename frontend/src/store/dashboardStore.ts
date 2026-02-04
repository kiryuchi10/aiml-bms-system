/**
 * Dashboard store: fleet, selected vehicle, pack view cache.
 */
import type { FleetCard, VehicleKpi, CellState } from '../services/dashboardApi'

export type DashboardState = {
  fleet: FleetCard[]
  selectedVehicle: VehicleKpi | null
  packView: CellState[]
  loading: boolean
  error: string | null
}

export const initialDashboardState: DashboardState = {
  fleet: [],
  selectedVehicle: null,
  packView: [],
  loading: false,
  error: null,
}
