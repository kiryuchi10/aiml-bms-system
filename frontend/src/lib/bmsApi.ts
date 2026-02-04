/**
 * BMS Dashboard API: pack summary, cell grid, timeseries, features.
 * Proxy: /api -> localhost:8000 (vite.config.ts).
 */

export type PackSummary = {
  pack_id: string
  ts: string
  soc: number
  soh: number
  sop_kw: number
  v_pack: number
  i_pack: number
  t_max: number
  alarm_level: 'NORMAL' | 'WARN' | 'DANGER'
}

export type CellSnapshot = {
  cell_id: string
  value: number
  status: string
  balancing: boolean
}

export type CellGridResponse = {
  pack_id: string
  module: number
  metric: string
  cells: CellSnapshot[]
  min: number
  max: number
}

export type TimeseriesRow = { ts: string; value: number }

export type TimeseriesResponse = {
  pack_id: string
  metric: string
  rows: TimeseriesRow[]
}

async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(path)
  if (!res.ok) throw new Error(await res.text())
  return res.json() as Promise<T>
}

export function getPackSummary(packId: string): Promise<PackSummary> {
  return apiGet(`/api/pack/summary?pack_id=${encodeURIComponent(packId)}`)
}

export function getCellGrid(
  packId: string,
  module = 1,
  metric = 'voltage'
): Promise<CellGridResponse> {
  return apiGet(
    `/api/cells/grid?pack_id=${encodeURIComponent(packId)}&module=${module}&metric=${metric}`
  )
}

export function getTimeseries(
  packId: string,
  metric = 'voltage',
  points = 300
): Promise<TimeseriesResponse> {
  return apiGet(
    `/api/timeseries?pack_id=${encodeURIComponent(packId)}&metric=${metric}&points=${points}`
  )
}

export function getSocFeatures(
  packId: string,
  cycleId: number
): Promise<{ pack_id: string; cycle_id: number; rows: Record<string, unknown>[] }> {
  return apiGet(`/api/features/soc?pack_id=${encodeURIComponent(packId)}&cycle_id=${cycleId}`)
}

export function getSohFeatures(
  packId: string
): Promise<{ pack_id: string; rows: Record<string, unknown>[] }> {
  return apiGet(`/api/features/soh?pack_id=${encodeURIComponent(packId)}`)
}
