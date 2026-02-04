/**
 * BMS dashboard types: pack/cells/alarms contract (REST + WebSocket).
 */

export type PackState = {
  pack_voltage?: number | null
  pack_current?: number | null
  soc?: number | null
  soh?: number | null
  pack_temp?: number | null
  ambient_temp?: number | null
  mode?: string | null
  ts?: string | null
}

export type CellState = {
  id: number
  v?: number | null
  t?: number | null
  i?: number | null
  soc?: number | null
  soh?: number | null
  bal?: boolean
  alarm?: boolean
}

export type AlarmState = {
  active: string[]
  latched: string[]
}

export type StreamControlState = {
  streaming: boolean
}

export type DashboardResponse = {
  vehicle_id: string
  pack: {
    voltage?: number | null
    current?: number | null
    soc?: number | null
    soh?: number | null
    pack_temp?: number | null
    ambient_temp?: number | null
    mode?: string | null
    ts?: string | null
    remaining_time?: string | null
    to_full?: string | null
    cc_charge?: string | null
  }
  cells: Array<{
    id: number
    v?: number | null
    t?: number | null
    i?: number | null
    soc?: number | null
    soh?: number | null
    bal?: boolean
    alarm?: boolean
    del_est?: number | null
    chg_est?: number | null
  }>
  alarms: AlarmState
  learnings: Record<string, unknown>
}

export type PackViewResponse = {
  vehicle_id: string
  ts: string
  min_cell_v: number | null
  max_cell_v: number | null
  cells: Array<{
    id: number
    v?: number | null
    t?: number | null
    bal: boolean
    alarm: boolean
  }>
}
