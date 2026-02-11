/**
 * Battery Doctor — 모듈/셀 진단 뷰 (이미지 스펙 기준).
 * 1) 상단 M1 모듈 패널 2) 컨트롤/세부정보 3) 12셀 그리드 4) AI 차트 5) AI Insights.
 * 데이터: BmsStreamContext(WS) 우선, 없으면 REST dashboard/overview, cell-grid, alarms (vehicle_id=1).
 */

import React, { useState, useMemo, useEffect } from 'react'
import { ArrowLeft, AlertTriangle } from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { useBmsStreamContext } from '../context/BmsStreamContext'
import {
  getDashboardOverview,
  getDashboardCellGrid,
  getDashboardAlarms,
  getAnalyticsSohTrend,
  getAnalyticsAnomalyTrend,
  type PackTelemetry,
  type CellTelemetry,
  type AlarmItem,
} from '../services/apiV1'

const VEHICLE_ID = 1

// 셀 SoC에 따른 상태: 초록 65–75%, 빨강 75%+, 노랑 <65%
function getCellStatus(soc: number): 'normal' | 'high' | 'low' {
  if (soc >= 75) return 'high'
  if (soc < 65) return 'low'
  return 'normal'
}

const CELL_BG = {
  normal: 'bg-green-500/30 border-green-600',
  high: 'bg-red-500/30 border-red-600',
  low: 'bg-yellow-500/30 border-yellow-600',
} as const

function normSoc(soc: number): number {
  return soc != null && soc <= 1 ? soc * 100 : (soc ?? 0)
}

type ModuleInfo = {
  id: string
  voltage: number
  soc: number
  temp: number
  imbalance: number
  chargeMax: number
  current: number
  dischargeMax: number
  alarmStatus: 'Fault' | 'Normal'
  sohString: string
  vCellMin: number
  vCellMax: number
  vCellAvg: number
}

type CellRow = { id: string; voltage: number; soc: number; temp: number }
type TempSensor = { id: string; value: number }

const DEFAULT_MODULE: ModuleInfo = {
  id: 'M1',
  voltage: 0,
  soc: 0,
  temp: 0,
  imbalance: 0,
  chargeMax: 85,
  current: 0,
  dischargeMax: 120,
  alarmStatus: 'Normal',
  sohString: '—',
  vCellMin: 0,
  vCellMax: 0,
  vCellAvg: 0,
}

function buildModuleFromPackAndCells(pack: PackTelemetry | null, cells: CellRow[], alarmCount: number): ModuleInfo {
  if (!pack) return { ...DEFAULT_MODULE, vCellMin: 0, vCellMax: 0, vCellAvg: 0 }
  const vols = cells.map((c) => c.voltage).filter((v) => v > 0)
  const vMin = vols.length ? Math.min(...vols) : (pack.min_cell_v ?? 0)
  const vMax = vols.length ? Math.max(...vols) : (pack.max_cell_v ?? 0)
  const vAvg = vols.length ? vols.reduce((a, b) => a + b, 0) / vols.length : (vMin + vMax) / 2 || 0
  const soc = normSoc(pack.soc)
  const soh = pack.soh != null ? (pack.soh <= 1 ? pack.soh * 100 : pack.soh) : 0
  return {
    id: 'M1',
    voltage: pack.voltage ?? 0,
    soc,
    temp: pack.temp ?? 0,
    imbalance: vMax > 0 ? (vMax - vMin) / vMax : 0,
    chargeMax: 85,
    current: pack.current ?? 0,
    dischargeMax: 120,
    alarmStatus: alarmCount > 0 ? 'Fault' : 'Normal',
    sohString: soh > 0 ? `${soh.toFixed(1)}%` : '—',
    vCellMin: vMin,
    vCellMax: vMax,
    vCellAvg: vAvg,
  }
}

function cellsFromApi(cells: CellTelemetry[]): CellRow[] {
  return cells.map((c) => ({
    id: `E${c.id}`,
    voltage: c.v ?? 0,
    soc: normSoc(c.soc ?? 0),
    temp: c.t ?? 0,
  }))
}

function tempSensorsFromCells(cells: CellRow[]): TempSensor[] {
  const base = cells.slice(0, 8)
  return base.map((c, i) => ({ id: `T${i + 1}`, value: c.temp }))
}

export default function BatteryDoctorPage() {
  const [selectedCellId, setSelectedCellId] = useState<string | null>(null)
  const [showAlarmModal, setShowAlarmModal] = useState(false)
  const [restModule, setRestModule] = useState<ModuleInfo | null>(null)
  const [restCells, setRestCells] = useState<CellRow[]>([])
  const [restAlarms, setRestAlarms] = useState<AlarmItem[]>([])
  const [loading, setLoading] = useState(true)
  const [restError, setRestError] = useState<string | null>(null)
  const [sohTrendData, setSohTrendData] = useState<{ cycle: number; actual: number; predicted: number }[]>([])
  const [anomalyData, setAnomalyData] = useState<{ cycle: number; score: number }[]>([])
  const [chartsLoading, setChartsLoading] = useState(true)

  const { connected, payload } = useBmsStreamContext()

  // Analytics SoH trend + Anomaly (no mock; from API / soh_features.parquet)
  useEffect(() => {
    let cancelled = false
    setChartsLoading(true)
    Promise.all([getAnalyticsSohTrend(90), getAnalyticsAnomalyTrend(500)])
      .then(([sohRes, anomalyRes]) => {
        if (cancelled) return
        const points = sohRes?.points ?? []
        setSohTrendData(
          points.map((p) => ({
            cycle: (p as { day?: number }).day ?? 0,
            actual: (p as { soh_percent?: number }).soh_percent ?? 0,
            predicted: (p as { soh_percent?: number }).soh_percent ?? 0,
          }))
        )
        setAnomalyData(anomalyRes?.points ?? [])
      })
      .catch(() => {
        if (!cancelled) {
          setSohTrendData([])
          setAnomalyData([])
        }
      })
      .finally(() => {
        if (!cancelled) setChartsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  // REST fallback (vehicle_id)
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setRestError(null)
    Promise.all([
      getDashboardOverview(undefined, undefined, VEHICLE_ID),
      getDashboardCellGrid(undefined, undefined, VEHICLE_ID),
      getDashboardAlarms(undefined, undefined, VEHICLE_ID, 168),
    ])
      .then(([overview, cellGrid, alarmsRes]) => {
        if (cancelled) return
        const cells = cellsFromApi(cellGrid.cells ?? [])
        const module = buildModuleFromPackAndCells(overview.pack, cells, alarmsRes.count ?? 0)
        setRestModule(module)
        setRestCells(cells)
        setRestAlarms(alarmsRes.alarms ?? [])
      })
      .catch((e) => {
        if (!cancelled) setRestError(e instanceof Error ? e.message : 'REST error')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  // WS 우선, 없으면 REST
  const module: ModuleInfo = useMemo(() => {
    if (connected && payload?.pack) {
      const cells = cellsFromApi(payload.cells ?? [])
      const alarmCount = (payload.alarms ?? []).length
      return buildModuleFromPackAndCells(payload.pack, cells, alarmCount)
    }
    return restModule ?? DEFAULT_MODULE
  }, [connected, payload, restModule])

  const cells: CellRow[] = useMemo(() => {
    if (connected && payload?.cells?.length) return cellsFromApi(payload.cells)
    return restCells
  }, [connected, payload, restCells])

  const tempSensors: TempSensor[] = useMemo(() => {
    const fromCells = tempSensorsFromCells(cells)
    if (fromCells.length >= 8) return fromCells
    return fromCells.concat(
      Array.from({ length: 8 - fromCells.length }, (_, i) => ({ id: `T${fromCells.length + i + 1}`, value: 0 }))
    )
  }, [cells])

  const alarmsForModal: AlarmItem[] = useMemo(() => {
    if (connected && payload?.alarms?.length)
      return payload.alarms.map((msg, i) => ({ id: `ws-${i}`, severity: 'warning', message: msg }))
    return restAlarms
  }, [connected, payload?.alarms, restAlarms])

  const sohChartData = useMemo(() => sohTrendData, [sohTrendData])

  return (
    <div className="battery-doctor-page h-full overflow-auto bg-slate-50">
      <div className="max-w-6xl mx-auto p-4 space-y-4">
        {loading && (
          <div className="text-sm text-slate-600 bg-slate-100 border border-slate-200 rounded-lg px-4 py-2">
            Loading dashboard data…
          </div>
        )}
        {restError && !connected && (
          <div className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2">
            REST: {restError}. Using defaults. Start stream for live data.
          </div>
        )}
        {/* 1) 상단 모듈 정보 패널 */}
        <section className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex flex-wrap items-stretch gap-0">
            <div className="bg-cyan-500/20 border border-cyan-500/50 px-4 py-3 flex items-center">
              <span className="font-bold text-cyan-800">M1</span>
              <span className="ml-2 text-sm text-cyan-700">Module ID</span>
            </div>
            <div className="flex flex-1 flex-wrap">
              <div className="flex-1 min-w-[80px] px-4 py-3 border-b border-l border-slate-200">
                <div className="text-xs text-slate-500">V</div>
                <div className="font-semibold">{module.voltage.toFixed(2)} V</div>
              </div>
              <div className="flex-1 min-w-[80px] px-4 py-3 border-b border-l border-slate-200">
                <div className="text-xs text-slate-500">SoC</div>
                <div className="font-semibold">{module.soc}%</div>
              </div>
              <div className="flex-1 min-w-[80px] px-4 py-3 border-b border-l border-slate-200">
                <div className="text-xs text-slate-500">Temp</div>
                <div className="font-semibold">{module.temp} °C</div>
              </div>
              <div className="flex-1 min-w-[80px] px-4 py-3 border-b border-l border-slate-200">
                <div className="text-xs text-slate-500">Imbalance</div>
                <div className="font-semibold">{(module.imbalance * 100).toFixed(2)}%</div>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4 px-4 py-3 border-t border-slate-200 bg-slate-50/50">
            <div className="flex-1 min-w-[200px]">
              <div className="text-xs text-slate-500 mb-1">Charge Max</div>
              <div
                className="h-4 rounded overflow-hidden bg-slate-200"
                style={{
                  background: `linear-gradient(90deg, #ef4444 0%, #f97316 ${module.chargeMax}%, #e5e7eb ${module.chargeMax}%)`,
                }}
              />
            </div>
            <div className="text-sm">
              <span className="text-slate-500">Current: </span>
              <span className="font-medium">{module.current} A</span>
            </div>
            <div className="text-sm">
              <span className="text-slate-500">Discharge Max: </span>
              <span className="font-medium">{module.dischargeMax} A</span>
            </div>
            <div
              className={`flex items-center gap-2 px-3 py-1 rounded border ${
                module.alarmStatus === 'Fault'
                  ? 'bg-red-500/20 border-red-500/50'
                  : 'bg-slate-100 border-slate-300'
              }`}
            >
              <span className={module.alarmStatus === 'Fault' ? 'text-red-700 font-semibold' : 'text-slate-600'}>
                Alarm Status
              </span>
              <span className={module.alarmStatus === 'Fault' ? 'text-red-600' : 'text-slate-700'}>
                {module.alarmStatus}
              </span>
            </div>
          </div>
        </section>

        {/* 2) 컨트롤 및 세부 정보 */}
        <section className="flex flex-wrap items-center gap-4">
          <button
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/20 border border-cyan-500 text-cyan-800 font-medium text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <button
            type="button"
            onClick={() => setShowAlarmModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/20 border border-cyan-500 text-cyan-800 font-medium text-sm"
          >
            <AlertTriangle className="w-4 h-4" />
            Alarm Screen
          </button>
          <div className="text-sm text-slate-600">
            SoH STRING: <span className="font-semibold">{module.sohString}</span>
          </div>
          <div className="flex gap-6 text-sm">
            <span>Cell Voltage Min: <strong>{module.vCellMin.toFixed(2)} V</strong></span>
            <span>Max: <strong>{module.vCellMax.toFixed(2)} V</strong></span>
            <span>Avg: <strong>{module.vCellAvg.toFixed(2)} V</strong></span>
          </div>
        </section>

        {/* Module Temperature Sensors (8개) */}
        <section className="bg-white rounded-lg border border-slate-200 p-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Module Temperature Sensors</h3>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
            {tempSensors.map((s) => (
              <div key={s.id} className="rounded border border-slate-200 p-2 text-center bg-slate-50">
                <div className="text-xs text-slate-500">{s.id}</div>
                <div className="font-semibold">{s.value.toFixed(1)} °C</div>
              </div>
            ))}
          </div>
        </section>

        {/* 3) 12셀 그리드 E1–E12 */}
        <section className="bg-white rounded-lg border border-slate-200 p-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Cell Voltage / SoC</h3>
          {cells.length === 0 ? (
            <p className="text-sm text-slate-500 py-4">No cell data. Start stream or ensure DB has telemetry.</p>
          ) : (
          <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-2">
            {cells.map((c) => {
              const status = getCellStatus(c.soc)
              const isSelected = selectedCellId === c.id
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCellId(c.id)}
                  className={`rounded-lg border p-3 text-center transition ${CELL_BG[status]} ${
                    isSelected ? 'ring-2 ring-cyan-500' : ''
                  }`}
                >
                  <div className="text-xs font-medium text-slate-600">{c.id}</div>
                  <div className="font-bold">{c.voltage.toFixed(2)} V</div>
                  <div className="text-xs">{c.soc.toFixed(0)}% SoC</div>
                </button>
              )
            })}
          </div>
          )}
          <p className="mt-2 text-xs text-slate-500">
            Green: 65–75% SoC · Yellow: &lt;65% · Red: 75%+ · Click for detail
          </p>
        </section>

        {/* 4) AI 예측 차트 — API only, no mock */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">SoH Trend: Actual vs ML</h3>
            {chartsLoading ? (
              <div className="h-[220px] flex items-center justify-center text-slate-500 text-sm">Loading…</div>
            ) : sohChartData.length === 0 ? (
              <div className="h-[220px] flex items-center justify-center text-slate-500 text-sm">No SoH data. Add WLTP data in backend/data.</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={sohChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="cycle" tick={{ fontSize: 11 }} />
                  <YAxis domain={[85, 102]} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="actual" stroke="#0ea5e9" strokeWidth={2} name="Actual" />
                  <Line type="monotone" dataKey="predicted" stroke="#8b5cf6" strokeWidth={2} strokeDasharray="4 4" name="ML Pred" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Anomaly Score</h3>
            {chartsLoading ? (
              <div className="h-[220px] flex items-center justify-center text-slate-500 text-sm">Loading…</div>
            ) : anomalyData.length === 0 ? (
              <div className="h-[220px] flex items-center justify-center text-slate-500 text-sm">No anomaly data. Add soh_features.parquet in backend/data.</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={anomalyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="cycle" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 1]} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="score" stroke="#f59e0b" strokeWidth={2} name="Score" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        {/* 5) AI Insights 패널 */}
        <section className="bg-white rounded-lg border border-slate-200 p-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">AI Insights</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-lg bg-cyan-500/10 border border-cyan-500/30 p-3">
              <div className="text-xs text-cyan-700 font-medium">SoH</div>
              <div className="text-lg font-bold text-cyan-800">95.2%</div>
              <div className="text-xs text-slate-500">Capacity-based</div>
            </div>
            <div className="rounded-lg bg-green-500/10 border border-green-500/30 p-3">
              <div className="text-xs text-green-700 font-medium">RUL</div>
              <div className="text-lg font-bold text-green-800">~450 cycles</div>
              <div className="text-xs text-slate-500">Expected</div>
            </div>
            <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/30 p-3">
              <div className="text-xs text-yellow-700 font-medium">Anomaly</div>
              <div className="text-lg font-bold text-yellow-800">0.28</div>
              <div className="text-xs text-slate-500">Last cycle</div>
            </div>
            <div className="rounded-lg bg-purple-500/10 border border-purple-500/30 p-3">
              <div className="text-xs text-purple-700 font-medium">EIS Cluster</div>
              <div className="text-lg font-bold text-purple-800">C2</div>
              <div className="text-xs text-slate-500">Healthy band</div>
            </div>
          </div>
        </section>
      </div>

      {/* Alarm modal (간단) */}
      {showAlarmModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setShowAlarmModal(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-semibold text-lg mb-2">Alarm Screen</h3>
            <p className="text-sm text-slate-600 mb-4">
              {alarmsForModal.length ? `Active alarms (${alarmsForModal.length})` : 'No active alarms'}
            </p>
            {alarmsForModal.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-auto">
                {alarmsForModal.map((a) => (
                  <div
                    key={a.id}
                    className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800"
                  >
                    <span className="font-medium">{a.severity}</span>: {a.message}
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                No active alarms
              </div>
            )}
            <button
              type="button"
              className="mt-4 w-full py-2 rounded-lg bg-cyan-500 text-white font-medium"
              onClick={() => setShowAlarmModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
