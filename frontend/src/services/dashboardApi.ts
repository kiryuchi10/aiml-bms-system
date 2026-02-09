/**
 * Dashboard API — 1–3 calls for Dashboard Home.
 * GET /api/v1/dashboard/overview (pack + worst cell + alarms + learnings)
 * GET /api/v1/dashboard/cell-table?limit=16 (cell rows)
 * Cells Grid: fetchCellGrid (adapter over getCellsLatest for spec-shaped response).
 */

import {
  getDashboardOverview,
  getDashboardCellGrid,
  getDashboardAlarms,
  getCellsLatest,
  type DashboardOverview,
  type DashboardCellGrid,
  type AlarmItem,
} from './apiV1'

// ---------- Cells Grid (spec contract) ----------

export type CellStatus = 'normal' | 'warning' | 'fault'

export type CellGridItem = {
  cell_id: number
  voltage_v: number
  temp_c: number
  soc: number
  balancing: boolean
  status: CellStatus
}

export type CellGridResponse = {
  pack_id: string
  ts: string
  summary: {
    total: number
    normal: number
    warning: number
    fault: number
    balancing_on: number
  }
  cells: CellGridItem[]
}

function statusFromCell(voltage: number | null, temp: number | null): CellStatus {
  const v = voltage ?? 0
  const t = temp ?? 0
  if (v >= 4.2 || v <= 2.5 || t >= 45) return 'fault'
  if (v >= 4.0 || v <= 2.8 || t >= 35) return 'warning'
  return 'normal'
}

/**
 * Fetch cell grid in spec shape. Uses GET /api/v1/cells/latest (vehicle_id from pack_id).
 * TODO: Backend GET /api/v1/dashboard/cell-grid?pack_id=pack_1 for native response.
 */
export async function fetchCellGrid(packId: string): Promise<CellGridResponse> {
  const vehicleId = packId === 'pack_1' ? 1 : 1
  const res = await getCellsLatest(vehicleId)
  const rows = res.cells ?? []
  let normal = 0
  let warning = 0
  let fault = 0
  let balancing_on = 0
  const cells: CellGridItem[] = rows.map((c) => {
    const status = statusFromCell(c.voltage ?? null, c.temperature ?? null)
    if (status === 'normal') normal++
    else if (status === 'warning') warning++
    else fault++
    if (c.balancing) balancing_on++
    return {
      cell_id: c.cell_id,
      voltage_v: c.voltage ?? 0,
      temp_c: c.temperature ?? 0,
      soc: c.soc != null ? Math.round(c.soc * 100) : 0,
      balancing: !!c.balancing,
      status,
    }
  })
  return {
    pack_id: packId,
    ts: new Date().toISOString(),
    summary: {
      total: cells.length,
      normal,
      warning,
      fault,
      balancing_on,
    },
    cells,
  }
}

export type OverviewResponse = {
  pack?: DashboardOverview['pack'] | null
  worst_cell?: { cell_id: number; voltage?: number; temperature?: number; reason?: string } | null
  active_alarms?: AlarmItem[]
  learnings?: { key: string; value: string | number }[]
  alarm_counts?: { active: number; latched: number }
  connection?: { status: 'connected' | 'disconnected' }
}

export type CellTableRow = {
  cell_id: number
  voltage?: number
  temperature?: number
  current?: number
  soc?: number
  soh?: number
  discharge_est?: number
  charge_est?: number
}

export type CellTableResponse = { rows: CellTableRow[] }

/** Single overview call: merge overview + alarms for Dashboard Home. */
export async function getOverview(): Promise<OverviewResponse> {
  const [ov, alarms] = await Promise.all([
    getDashboardOverview(),
    getDashboardAlarms().catch(() => ({ alarms: [] as AlarmItem[], count: 0 })),
  ])
  const pack = ov?.pack
  const worst_cell =
    pack != null && (pack.min_cell_v != null || pack.max_cell_v != null)
      ? {
          cell_id: 0,
          voltage: pack.max_cell_v ?? pack.min_cell_v ?? undefined,
          temperature: pack.temp ?? undefined,
          reason: 'min/max cell',
        }
      : null
  return {
    pack,
    worst_cell,
    active_alarms: (alarms?.alarms ?? []).slice(0, 10),
    learnings: [], // TODO: backend to add learnings to overview
    alarm_counts: { active: ov?.alarm_count ?? 0, latched: 0 },
    connection: { status: 'disconnected' },
  }
}

/** Cell table for CellTable component. Uses cell-grid and maps to rows. */
export async function getCellTable(params: { limit?: number }): Promise<CellTableResponse> {
  const limit = params?.limit ?? 16
  const grid: DashboardCellGrid = await getDashboardCellGrid()
  const cells = grid?.cells ?? []
  const rows: CellTableRow[] = cells.slice(0, limit).map((c) => ({
    cell_id: c.id,
    voltage: c.v,
    temperature: c.t,
    soc: c.soc,
    soh: c.soh,
  }))
  return { rows }
}

export const dashboardApi = { getOverview, getCellTable, fetchCellGrid }
