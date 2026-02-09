/**
 * Telemetry API — cell detail (current + series + alarm_history).
 * Adapter over GET /api/v1/cells/latest, timeseries, dashboard/active-alarms.
 * TODO: Backend GET /api/v1/telemetry/cell/detail?pack_id=&cell_id=&window_min= for native response.
 */

import {
  getCellsLatest,
  getCellTimeseries,
  getActiveAlarms,
} from './apiV1'

export type CellDetailResponse = {
  pack_id: string
  cell_id: number
  current: {
    voltage_v: number
    temp_c: number
    current_a: number
    soc: number
    soh: number
    internal_r_mohm: number
  }
  series: {
    ts: string[]
    voltage_v: number[]
    temp_c: number[]
  }
  alarm_history: Array<{
    ts: string
    severity: string
    code: string
    title: string
    rationale: string
  }>
}

function vehicleIdFromPackId(packId: string): number {
  return packId === 'pack_1' ? 1 : 1
}

export async function fetchCellDetail(
  packId: string,
  cellId: number,
  windowMin: number
): Promise<CellDetailResponse> {
  const vehicleId = vehicleIdFromPackId(packId)
  const end = new Date()
  const start = new Date(end.getTime() - windowMin * 60 * 1000)
  const startStr = start.toISOString()
  const endStr = end.toISOString()

  const [latestRes, voltageRes, tempRes, alarmsRes] = await Promise.all([
    getCellsLatest(vehicleId),
    getCellTimeseries(cellId, {
      vehicleId,
      signal: 'voltage',
      start: startStr,
      end: endStr,
      limit: 500,
    }),
    getCellTimeseries(cellId, {
      vehicleId,
      signal: 'temperature',
      start: startStr,
      end: endStr,
      limit: 500,
    }),
    getActiveAlarms(vehicleId, 24),
  ])

  const cell = (latestRes.cells ?? []).find((c) => c.cell_id === cellId)
  const vPoints = voltageRes.points ?? []
  const tPoints = tempRes.points ?? []
  const alarms = (alarmsRes.alarms ?? []).filter((a) => a.cell_id === cellId)
  const ts = vPoints.map((p) => p.ts)
  const voltage_v = vPoints.map((p) => p.value)
  const temp_c = ts.map((_, i) => (tPoints[i]?.value ?? 0))

  return {
    pack_id: packId,
    cell_id: cellId,
    current: {
      voltage_v: cell?.voltage ?? 0,
      temp_c: cell?.temperature ?? 0,
      current_a: cell?.current ?? 0,
      soc: cell?.soc != null ? cell.soc * 100 : 0,
      soh: 98, // TODO: from backend when available
      internal_r_mohm: 45, // TODO: from backend when available
    },
    series: {
      ts,
      voltage_v,
      temp_c,
    },
    alarm_history: alarms.map((a) => ({
      ts: a.ts ?? '',
      severity: a.severity ?? 'info',
      code: a.alarm_type ?? 'ALARM',
      title: a.alarm_type ?? 'Alarm',
      rationale: a.rationale ?? '',
    })),
  }
}
