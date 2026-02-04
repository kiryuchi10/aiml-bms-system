/**
 * Dashboard API client: Base http://localhost:8000, prefix /api/v1.
 * GET /dashboard/fleet, /dashboard/vehicle/{id}, /dashboard/vehicle/{id}/pack-view.
 */
const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8000'
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

export type CellState = {
  cell_id: string
  voltage: number | null
  temperature: number | null
  soc: number | null
  is_active: boolean
  balancing: boolean
}

function getToken(): string | null {
  return localStorage.getItem('token')
}

async function fetchJson<T>(path: string): Promise<T> {
  const url = `${API_BASE}${PREFIX}${path}`
  const headers: HeadersInit = {}
  const token = getToken()
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(url, { headers })
  if (!res.ok) throw new Error(await res.text())
  return res.json() as Promise<T>
}

export function getFleet(): Promise<FleetCard[]> {
  return fetchJson<FleetCard[]>('/dashboard/fleet')
}

export function getDashboardVehicle(vehicleId: number): Promise<VehicleKpi> {
  return fetchJson<VehicleKpi>(`/dashboard/vehicle/${vehicleId}`)
}

export function getPackView(vehicleId: number): Promise<CellState[]> {
  return fetchJson<CellState[]>(`/dashboard/vehicle/${vehicleId}/pack-view`)
}
