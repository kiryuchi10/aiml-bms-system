/**
 * BMS Simulator – real-time battery pack data for dashboard.
 * Simulates voltage, current, temperature, SoC, and alarms.
 */

export interface CellData {
  id: number
  voltage: number
  temp: number
  current: number
  absSoc: number
  soh: number
  disEsr: number
  chgEsr: number
  active: boolean
}

export interface AlarmData {
  id: string
  label: string
  active: boolean
  latched: boolean
}

export interface BMSState {
  timestamp: Date
  connected: boolean
  running: boolean
  isCharging: boolean
  isDischarging: boolean
  packVoltage: number
  packCurrent: number
  packStatus: string
  ambientTemp: number
  packTemp: number
  packSoc: number
  unusableSoc: number
  packSoh: number
  remainingToEmpty: string
  remainingToFull: string
  ccCharge: string
  cells: CellData[]
  alarms: AlarmData[]
  learnings: {
    ccChargerCurrent: number
    avgLoadCurrent: number
    chargerEndCurrent: number
    loadEndCurrent: number
    cvChargerVoltage: number
    heatTransferCoeff: number
  }
}

type Listener = (state: BMSState) => void

const NUM_ACTIVE_CELLS = 10
const NUM_TOTAL_CELLS = 16
const BASE_VOLTAGE = 3.03
const NOISE = 0.008
const OV_THRESHOLD = 4.15
const UV_THRESHOLD = 2.7
const OT_THRESHOLD = 45
const PACK_OV = 42
const PACK_UV = 27
const MISMATCH_THRESHOLD = 0.1

let state: BMSState = {
  timestamp: new Date(),
  connected: true,
  running: false,
  isCharging: false,
  isDischarging: true,
  packVoltage: 30.232,
  packCurrent: -0.057,
  packStatus: 'Discharge',
  ambientTemp: 25.16,
  packTemp: 25.86,
  packSoc: 8.24,
  unusableSoc: 0,
  packSoh: 100,
  remainingToEmpty: '0h 1min',
  remainingToFull: '1h 38min',
  ccCharge: 'Empty',
  cells: [],
  alarms: [],
  learnings: {
    ccChargerCurrent: 1.25,
    avgLoadCurrent: 1.25,
    chargerEndCurrent: 0.25,
    loadEndCurrent: 1.25,
    cvChargerVoltage: 41.5,
    heatTransferCoeff: 23,
  },
}

const alarmLabels: AlarmData[] = [
  { id: 'cell_ov', label: 'Cell OV', active: false, latched: false },
  { id: 'afe_ot', label: 'AFE OT', active: false, latched: false },
  { id: 'cell_uv', label: 'Cell UV', active: false, latched: false },
  { id: 'cell_ot', label: 'Cell OT', active: false, latched: false },
  { id: 'cell_ut', label: 'Cell UT', active: false, latched: false },
  { id: 'pack_ov', label: 'Pack OV', active: false, latched: false },
  { id: 'pack_uv', label: 'Pack UV', active: false, latched: false },
  { id: 'pcb_ot', label: 'PCB OT', active: false, latched: false },
  { id: 'open_wire', label: 'Open Wire', active: true, latched: false },
  { id: 'charge_oc', label: 'Charge OC', active: false, latched: false },
  { id: 'discharge_oc', label: 'Discharge OC', active: false, latched: false },
  { id: 'charge_sc', label: 'Charge SC', active: false, latched: false },
  { id: 'discharge_sc', label: 'Discharge SC', active: false, latched: false },
  { id: 'fet_error', label: 'FET Driver Error', active: false, latched: false },
  { id: 'system_error', label: 'System Error', active: false, latched: false },
  { id: 'cell_mismatch', label: 'Cell Mismatch', active: false, latched: false },
]

function randomNoise(scale: number): number {
  return (Math.random() - 0.5) * 2 * scale
}

function buildCells(): CellData[] {
  const cells: CellData[] = []
  let packV = 0
  const cellCurrent = state.packCurrent / NUM_ACTIVE_CELLS
  for (let i = 0; i < NUM_TOTAL_CELLS; i++) {
    const active = i < NUM_ACTIVE_CELLS
    const v = active
      ? BASE_VOLTAGE + randomNoise(NOISE) + (i % 3) * 0.003
      : 0
    const temp = active ? state.packTemp + randomNoise(0.1) : 0
    if (active) packV += v
    cells.push({
      id: i + 1,
      voltage: Math.round(v * 10000) / 10000,
      temp: Math.round(temp * 100) / 100,
      current: active ? Math.round(cellCurrent * 1000) / 1000 : 0,
      absSoc: active ? 2.8 : 0,
      soh: active ? 100 : 100,
      disEsr: active ? 100 : 100,
      chgEsr: active ? 100 : 100,
      active,
    })
  }
  state.packVoltage = Math.round(packV * 1000) / 1000
  return cells
}

function checkAlarms(cells: CellData[]): AlarmData[] {
  const voltages = cells.filter((c) => c.active).map((c) => c.voltage)
  const temps = cells.filter((c) => c.active).map((c) => c.temp)
  const maxV = Math.max(...voltages, 0)
  const minV = Math.min(...voltages, 4)
  const maxTemp = Math.max(...temps, 0)
  const mismatch = voltages.length ? Math.max(...voltages) - Math.min(...voltages) : 0

  return alarmLabels.map((a) => {
    let active = a.active
    if (a.id === 'cell_ov') active = maxV >= OV_THRESHOLD
    if (a.id === 'cell_uv') active = minV <= UV_THRESHOLD
    if (a.id === 'cell_ot') active = maxTemp >= OT_THRESHOLD
    if (a.id === 'pack_ov') active = state.packVoltage >= PACK_OV
    if (a.id === 'pack_uv') active = state.packVoltage <= PACK_UV
    if (a.id === 'cell_mismatch') active = mismatch >= MISMATCH_THRESHOLD
    return { ...a, active }
  })
}

function tick(): void {
  state.timestamp = new Date()
  state.cells = buildCells()
  state.alarms = checkAlarms(state.cells)
  if (state.isDischarging && state.packSoc > 0) {
    state.packSoc = Math.max(0, state.packSoc - 0.02)
  }
  if (state.isCharging && state.packSoc < 100) {
    state.packSoc = Math.min(100, state.packSoc + 0.05)
  }
  state.packTemp = state.ambientTemp + 0.5 + randomNoise(0.2)
}

const listeners = new Set<Listener>()
let intervalId: ReturnType<typeof setInterval> | null = null

function notify(): void {
  const copy = { ...state, cells: [...state.cells], alarms: state.alarms.map((a) => ({ ...a })) }
  listeners.forEach((fn) => fn(copy))
}

// Initial population of cells and alarms
state.cells = buildCells()
state.alarms = checkAlarms(state.cells)

export const bmsSimulator = {
  getState(): BMSState {
    return { ...state, cells: [...state.cells], alarms: state.alarms.map((a) => ({ ...a })) }
  },

  subscribe(fn: Listener): () => void {
    listeners.add(fn)
    return () => listeners.delete(fn)
  },

  start(ms: number = 1000): void {
    if (intervalId) return
    state.running = true
    intervalId = setInterval(() => {
      tick()
      notify()
    }, ms)
    tick()
    notify()
  },

  stop(): void {
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }
    state.running = false
    notify()
  },

  toggleMode(): void {
    state.isCharging = !state.isCharging
    state.isDischarging = !state.isCharging
    state.packCurrent = state.isCharging ? 1.26 : -0.057
    state.packStatus = state.isCharging ? 'Charge' : 'Discharge'
    tick()
    notify()
  },

  resetFuelGauge(): void {
    state.packSoc = 8.24
    state.packSoh = 100
    state.remainingToEmpty = '0h 1min'
    state.remainingToFull = '1h 38min'
    state.ccCharge = 'Empty'
    tick()
    notify()
  },

  exportCSV(): string {
    const headers = ['timestamp', 'packVoltage', 'packCurrent', 'packSoc', 'packTemp', ...state.cells.map((c) => `cell_${c.id}_V`)]
    const row = [
      state.timestamp.toISOString(),
      state.packVoltage,
      state.packCurrent,
      state.packSoc,
      state.packTemp,
      ...state.cells.map((c) => c.voltage),
    ]
    return [headers.join(','), row.join(',')].join('\n')
  },
}
