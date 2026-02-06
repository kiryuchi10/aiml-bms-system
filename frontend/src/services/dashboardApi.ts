/**
 * Dashboard API — 1–3 calls for Dashboard Home.
 * GET /api/v1/dashboard/overview (pack + worst cell + alarms + learnings)
 * GET /api/v1/dashboard/cell-table?limit=16 (cell rows)
 */

import {
  getDashboardOverview,
  getDashboardCellGrid,
  getDashboardAlarms,
  type DashboardOverview,
  type DashboardCellGrid,
  type AlarmItem,
} from './apiV1'

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

export const dashboardApi = { getOverview, getCellTable }
