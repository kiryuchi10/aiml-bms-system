/**
 * Dashboard API client: Base http://localhost:8000, prefix /api/v1.
 * BMS: GET /dashboard/vehicle/{vehicleId}, /dashboard/vehicle/{vehicleId}/pack-view (string vehicleId).
 * Fleet: GET /dashboard/fleet, /dashboard/vehicle/{id} (int).
 */
import { apiGet } from './api'
import type { DashboardResponse, PackViewResponse } from '../types/bms'

const PREFIX = '/api/v1'

export type FleetCard = {
  vehicle_id: number
  vin: string
  name: string | null
  trip_count: number
  charging_count: number
}

export type VehicleKpi = {
  vehicle_id: number
  vin: string
  trip_count: number
  charging_count: number
}

export type CellStateLegacy = {
  cell_id: string
  voltage: number | null
  temperature: number | null
  soc: number | null
  is_active: boolean
  balancing: boolean
}

async function fetchJson<T>(path: string): Promise<T> {
  return apiGet<T>(`${PREFIX}${path}`)
}

/** BMS dashboard: full pack/cells/alarms/learnings (string vehicleId, e.g. MBM165-P50-B). */
export function getVehicleDashboard(vehicleId: string): Promise<DashboardResponse> {
  return fetchJson<DashboardResponse>(`/dashboard/vehicle/${vehicleId}`)
}

/** BMS pack-view: ts, min/max cell V, cells for grid. */
export function getPackViewBms(vehicleId: string): Promise<PackViewResponse> {
  return fetchJson<PackViewResponse>(`/dashboard/vehicle/${vehicleId}/pack-view`)
}

export function getFleet(): Promise<FleetCard[]> {
  return fetchJson<FleetCard[]>('/dashboard/fleet')
}

export function getDashboardVehicle(vehicleId: number): Promise<VehicleKpi> {
  return fetchJson<VehicleKpi>(`/dashboard/vehicle/${vehicleId}`)
}

export function getPackView(vehicleId: number): Promise<CellStateLegacy[]> {
  return fetchJson<CellStateLegacy[]>(`/dashboard/vehicle/${vehicleId}/pack-view`)
}
