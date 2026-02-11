/**
 * API v1 client: dashboard, telemetry, analytics, balancing.
 * Uses VITE_API_BASE and VITE_BMS_WS_URL when set.
 */

const API_BASE = (import.meta as unknown as { env?: { VITE_API_BASE?: string } }).env?.VITE_API_BASE ?? ''
const API_V1 = API_BASE || '/api/v1'
const WS_BMS_BASE = (import.meta as unknown as { env?: { VITE_BMS_WS_URL?: string } }).env?.VITE_BMS_WS_URL ?? ''

export type PackTelemetry = {
  voltage: number
  current: number
  temp: number
  soc: number
  soh: number
  min_cell_v: number
  max_cell_v: number
  status: string
}

export type CellTelemetry = {
  id: number
  v: number
  t: number
  balancing: boolean
  soc: number
  soh: number
  status: string
}

export type DashboardOverview = {
  timestamp: string
  dataset_key: string | null
  row_index: number | null
  pack: PackTelemetry
  alarm_count: number
  balancing_active_count: number
}

export type DashboardCellGrid = {
  timestamp: string
  cells: CellTelemetry[]
  pack_mean_v: number
  pack_min_v: number
  pack_max_v: number
}

export type BalancingStatus = {
  active_cell_ids: number[]
  max_active: number
  detail: string
}

export type AlarmItem = {
  id: string
  severity: string
  message: string
}

export type DashboardAlarms = {
  alarms: AlarmItem[]
  count: number
}

export type WsBmsPayload = {
  type?: string
  timestamp: string
  pack: PackTelemetry
  cells: CellTelemetry[]
  balancing: BalancingStatus
  alarms: string[]
}

function resolvePath(path: string): string {
  if (path.startsWith('http')) return path
  if (API_BASE) {
    const base = API_BASE.replace(/\/$/, '')
    const suffix = path.startsWith('/api/v1') ? path.slice(7) || '/' : path
    return base + (suffix.startsWith('/') ? suffix : `/${suffix}`)
  }
  return new URL(path, window.location.origin).href
}

async function get<T>(path: string, params?: Record<string, string | number>): Promise<T> {
  const full = resolvePath(path.startsWith('/') ? path : `/${path}`)
  const url = new URL(full)
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)))
  }
  const res = await fetch(url.toString(), { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(await res.text())
  return res.json() as Promise<T>
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const fullPath = path.startsWith('http') ? path : resolvePath(path.startsWith('/') ? path : `/${path}`)
  const res = await fetch(fullPath, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json() as Promise<T>
}

/** GET /api/v1/dashboard/overview — use vehicle_id when no dataset_key for DB-backed data */
export function getDashboardOverview(datasetKey?: string | null, rowIndex?: number, vehicleId = 1) {
  const params: Record<string, string | number> = {}
  if (datasetKey) params.dataset_key = datasetKey
  if (rowIndex != null) params.row_index = rowIndex
  if (!datasetKey) params.vehicle_id = vehicleId
  return get<DashboardOverview>(`${API_V1}/dashboard/overview`, Object.keys(params).length ? params : undefined)
}

/** GET /api/v1/dashboard/cell-grid — use vehicle_id when no dataset_key for DB-backed data */
export function getDashboardCellGrid(datasetKey?: string | null, rowIndex?: number, vehicleId = 1) {
  const params: Record<string, string | number> = {}
  if (datasetKey) params.dataset_key = datasetKey
  if (rowIndex != null) params.row_index = rowIndex
  if (!datasetKey) params.vehicle_id = vehicleId
  return get<DashboardCellGrid>(`${API_V1}/dashboard/cell-grid`, Object.keys(params).length ? params : undefined)
}

/** GET /api/v1/dashboard/balancing-status */
export function getDashboardBalancingStatus(datasetKey?: string | null) {
  const params = datasetKey ? { dataset_key: datasetKey } : undefined
  return get<BalancingStatus>(`${API_V1}/dashboard/balancing-status`, params)
}

/** GET /api/v1/dashboard/alarms — use vehicle_id when no dataset_key for DB-backed data */
export function getDashboardAlarms(datasetKey?: string | null, rowIndex?: number, vehicleId = 1, hours = 168) {
  const params: Record<string, string | number> = {}
  if (datasetKey) params.dataset_key = datasetKey
  if (rowIndex != null) params.row_index = rowIndex
  if (!datasetKey) {
    params.vehicle_id = vehicleId
    params.hours = hours
  }
  return get<DashboardAlarms>(`${API_V1}/dashboard/alarms`, Object.keys(params).length ? params : undefined)
}

/** POST /api/v1/dashboard/balancing/set */
export function setBalancing(datasetKey: string, cellId: number, enabled: boolean) {
  return post<{ ok: boolean; cell_id: number; enabled: boolean }>(`${API_V1}/dashboard/balancing/set`, {
    dataset_key: datasetKey,
    cell_id: cellId,
    enabled,
  })
}

/** WebSocket URL for BMS stream. Uses VITE_BMS_WS_URL or relative /ws/bms. */
export function getBmsWsUrl(datasetKey?: string | null): string {
  const base = WS_BMS_BASE || `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws/bms`
  const url = new URL(base)
  if (datasetKey) url.searchParams.set('dataset_key', datasetKey)
  url.searchParams.set('interval_ms', '1000')
  return url.toString()
}

/** WS URL with ?dataset=B0005&hz=1 (for BmsStreamContext). */
export function getBmsWsUrlWithParams(dataset: string, hz: number): string {
  const base = WS_BMS_BASE || `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws/bms`
  const url = new URL(base)
  url.searchParams.set('dataset', dataset)
  url.searchParams.set('hz', String(hz))
  return url.toString()
}

/** WebSocket URL for BMS DB replay stream */
export function getBmsWsDbUrl(vehicleId = 1, intervalMs = 500): string {
  const base = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws/bms/db`
  return `${base}?vehicle_id=${vehicleId}&interval_ms=${intervalMs}`
}

// ---------- DB-backed dashboard (vehicle_id) ----------

export type PackSummary = {
  ts: string | null
  pack_voltage: number | null
  pack_current: number | null
  pack_temp: number | null
  soc: number | null
  soh: number | null
  min_cell_v: number | null
  max_cell_v: number | null
  cell_count: number | null
}

export type WorstCell = {
  cell_id: number
  ts: string | null
  voltage: number | null
  temperature: number | null
  current: number | null
  soc: number | null
  reason: string
}

export type AlarmEventDb = {
  id: number
  vehicle_id: number
  cell_id: number | null
  ts: string | null
  severity: string
  alarm_type: string
  value: number | null
  threshold: number | null
  rationale: string | null
  source: string | null
}

export type ActiveAlarmsResponse = { alarms: AlarmEventDb[]; count: number }

export type CellLatestRow = {
  cell_id: number
  ts: string | null
  voltage: number | null
  current: number | null
  temperature: number | null
  soc: number | null
  balancing: boolean
}

export type CellsLatestResponse = { vehicle_id: number; cells: CellLatestRow[] }

export type TimeseriesPoint = { ts: string; value: number }

export type CellTimeseriesResponse = {
  vehicle_id: number
  cell_id: number
  signal: string
  points: TimeseriesPoint[]
}

/** GET /api/v1/dashboard/pack-summary */
export function getPackSummary(vehicleId = 1) {
  return get<PackSummary>(`${API_V1}/dashboard/pack-summary`, { vehicle_id: vehicleId })
}

/** GET /api/v1/dashboard/worst-cell */
export function getWorstCell(vehicleId = 1) {
  return get<WorstCell>(`${API_V1}/dashboard/worst-cell`, { vehicle_id: vehicleId })
}

/** GET /api/v1/dashboard/active-alarms */
export function getActiveAlarms(vehicleId = 1, hours = 24) {
  return get<ActiveAlarmsResponse>(`${API_V1}/dashboard/active-alarms`, { vehicle_id: vehicleId, hours })
}

// ---------- Alarms API (list, detail, ack) ----------

export type AlarmEvidenceItem = {
  id: number
  alarm_id: number
  reason_type: string
  description: string | null
  rule_id: string | null
  rule_json: Record<string, unknown> | null
  model_run_id: number | null
  model_name: string | null
  anomaly_score: number | null
  anomaly_threshold: number | null
  top_features: unknown[] | null
  created_at: string | null
}

export type AlarmDetail = AlarmEventDb & {
  module_id: number | null
  acknowledged_at: string | null
  acknowledged_by: string | null
  evidence: AlarmEvidenceItem[]
  recommended_action: string
}

export type AlarmsListResponse = { alarms: AlarmEventDb[]; count: number }

/** GET /api/v1/alarms */
export function getAlarmsList(vehicleId = 1, hours = 168, limit = 200) {
  return get<AlarmsListResponse>(`${API_V1}/alarms`, { vehicle_id: vehicleId, hours, limit })
}

/** GET /api/v1/alarms/{id} */
export function getAlarmDetail(alarmId: number) {
  return get<AlarmDetail>(`${API_V1}/alarms/${alarmId}`)
}

/** POST /api/v1/alarms/{id}/ack */
export function postAlarmAck(alarmId: number, acknowledgedBy?: string) {
  return post<{ ok: boolean; alarm_id: number; acknowledged_by: string }>(
    `${API_V1}/alarms/${alarmId}/ack`,
    acknowledgedBy != null ? { acknowledged_by: acknowledgedBy } : {}
  )
}

/** GET /api/v1/cells/latest */
export function getCellsLatest(vehicleId = 1) {
  return get<CellsLatestResponse>(`${API_V1}/cells/latest`, { vehicle_id: vehicleId })
}

/** GET /api/v1/cells/timeseries */
export function getCellTimeseries(
  cellId: number,
  options: {
    vehicleId?: number
    signal?: 'voltage' | 'current' | 'temperature' | 'soc'
    start?: string
    end?: string
    agg_sec?: number
    limit?: number
  } = {}
) {
  const params: Record<string, string | number> = { cell_id: cellId }
  if (options.vehicleId != null) params.vehicle_id = options.vehicleId
  if (options.signal) params.signal = options.signal
  if (options.start) params.start = options.start
  if (options.end) params.end = options.end
  if (options.agg_sec != null) params.agg_sec = options.agg_sec
  if (options.limit != null) params.limit = options.limit
  return get<CellTimeseriesResponse>(`${API_V1}/cells/timeseries`, params)
}

// ---------- ML ----------

export type MlDataset = { vehicle_id: number; window_sec: number; row_count: number }
export type MlRunSummary = {
  id: number
  vehicle_id: number | null
  run_name: string | null
  dataset_name: string
  model_name: string
  status: string
  created_at: string
  finished_at: string | null
}
export type MlRunDetail = MlRunSummary & {
  config_json: Record<string, unknown> | null
  artifact_uri: string | null
  metrics: { metric_name: string; metric_value: number | null }[]
}

/** GET /api/v1/ml/datasets */
export function getMlDatasets() {
  return get<{ datasets: MlDataset[] }>(`${API_V1}/ml/datasets`)
}

/** POST /api/v1/ml/train */
export function postMlTrain(body: {
  dataset_key: string
  model_key?: string
  sequence_length?: number
  epochs?: number
  batch_size?: number
  val_ratio?: number
  seed?: number
}, asyncRun = false) {
  const path = `${API_V1}/ml/train${asyncRun ? '?async_run=true' : ''}`
  return post<{ run_id: number; status?: string; ok?: boolean; [k: string]: unknown }>(path, body)
}

/** GET /api/v1/ml/runs */
export function getMlRuns(bmsOnly = true) {
  return get<MlRunSummary[]>(`${API_V1}/ml/runs`, { bms_only: bmsOnly ? 'true' : 'false' })
}

/** GET /api/v1/ml/runs/{id} */
export function getMlRun(runId: number) {
  return get<MlRunDetail>(`${API_V1}/ml/runs/${runId}`)
}

// ---------- Analytics (time-series + heatmaps) ----------

export type SocTrendPoint = { timestamp: string; soc_percent: number }
export type SohTrendPoint = { day: number; soh_percent: number }
export type AnalyticsSocTrend = { points: SocTrendPoint[]; hours: number }
export type AnalyticsSohTrend = { points: SohTrendPoint[]; days: number }
export type ThermalMapData = { rows: number; cols: number; values: number[]; status: string[]; pack_temp?: number }
export type AgingMapData = { rows: number; cols: number; values: number[]; status: string[] }

/** GET /api/v1/analytics/soc?hours=24 */
export function getAnalyticsSocTrend(hours = 24) {
  return get<AnalyticsSocTrend>(`${API_V1}/analytics/soc`, { hours })
}

/** GET /api/v1/analytics/soh?days=30 */
export function getAnalyticsSohTrend(days = 30) {
  return get<AnalyticsSohTrend>(`${API_V1}/analytics/soh`, { days })
}

/** GET /api/v1/analytics/thermal */
export function getAnalyticsThermal(datasetKey?: string, rowIndex?: number) {
  const params: Record<string, string | number> = {}
  if (datasetKey) params.dataset_key = datasetKey
  if (rowIndex != null) params.row_index = rowIndex
  return get<{ pack_temp: number; min_cell_temp: number; max_cell_temp: number; status: string }>(
    `${API_V1}/analytics/thermal`,
    Object.keys(params).length ? params : undefined
  )
}

/** GET /api/v1/analytics/aging */
export function getAnalyticsAging(datasetKey?: string, rowIndex?: number) {
  const params: Record<string, string | number> = {}
  if (datasetKey) params.dataset_key = datasetKey
  if (rowIndex != null) params.row_index = rowIndex
  return get<AgingMapData>(`${API_V1}/analytics/aging`, Object.keys(params).length ? params : undefined)
}

/** GET /api/v1/analytics/thermal-map (heatmap grid) */
export function getAnalyticsThermalMap(datasetKey?: string, rowIndex?: number) {
  const params: Record<string, string | number> = {}
  if (datasetKey) params.dataset_key = datasetKey
  if (rowIndex != null) params.row_index = rowIndex
  return get<ThermalMapData>(
    `${API_V1}/analytics/thermal-map`,
    Object.keys(params).length ? params : undefined
  )
}

/** GET /api/v1/analytics/anomaly — anomaly score timeline (soh_features.parquet); no mock */
export type AnomalyPoint = { cycle: number; score: number }
export type AnalyticsAnomalyTrend = { points: AnomalyPoint[]; days: number }

export function getAnalyticsAnomalyTrend(limit = 500) {
  return get<AnalyticsAnomalyTrend>(`${API_V1}/analytics/anomaly`, { limit })
}
