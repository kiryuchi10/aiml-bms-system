/**
 * BMS Dashboard v1: real data from FastAPI (REST + WebSocket).
 * Cell grid, balancing status, alarm panel, realtime charts.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { CellGrid } from '../components/bms/CellGrid'
import { BalancingStatus } from '../components/bms/BalancingStatus'
import { AlarmPanel } from '../components/bms/AlarmPanel'
import { RealtimeChart, type ChartPoint } from '../components/bms/RealtimeChart'
import {
  getDashboardOverview,
  getDashboardCellGrid,
  getDashboardBalancingStatus,
  getDashboardAlarms,
  setBalancing,
} from '../services/apiV1'
import { useBmsStream } from '../hooks/useBmsStream'
import type { DashboardOverview as OverviewType, DashboardAlarms as AlarmsType, AlarmItem } from '../services/apiV1'
import '../styles/BMSDashboard.css'

const CHART_MAX_POINTS = 60

export function DashboardPage() {
  const [datasetKey, setDatasetKey] = useState<string | null>(null)
  const [overview, setOverview] = useState<OverviewType | null>(null)
  const [cellGrid, setCellGrid] = useState<Awaited<ReturnType<typeof getDashboardCellGrid>> | null>(null)
  const [balancingStatus, setBalancingStatus] = useState<Awaited<ReturnType<typeof getDashboardBalancingStatus>> | null>(null)
  const [alarms, setAlarms] = useState<AlarmsType | null>(null)
  const [restError, setRestError] = useState<string | null>(null)
  const [chartPoints, setChartPoints] = useState<ChartPoint[]>([])

  const { payload: wsPayload, connected } = useBmsStream(datasetKey)

  // Initial load: get first dataset and fetch REST
  useEffect(() => {
    let cancelled = false
    getDashboardOverview()
      .then((o) => {
        if (!cancelled && o?.dataset_key) {
          setDatasetKey(o.dataset_key)
          setOverview(o)
        }
      })
      .catch((e) => !cancelled && setRestError(e.message))
    return () => { cancelled = true }
  }, [])

  // When dataset known, fetch grid, balancing, alarms (REST fallback)
  useEffect(() => {
    if (!datasetKey) return
    let cancelled = false
    Promise.all([
      getDashboardCellGrid(datasetKey, 0),
      getDashboardBalancingStatus(datasetKey),
      getDashboardAlarms(datasetKey, 0),
    ])
      .then(([grid, bal, alm]) => {
        if (!cancelled) {
          setCellGrid(grid)
          setBalancingStatus(bal)
          setAlarms(alm)
        }
      })
      .catch((e) => !cancelled && setRestError(e.message))
    return () => { cancelled = true }
  }, [datasetKey])

  // Merge WS payload into state for live view
  useEffect(() => {
    if (!wsPayload) return
    setOverview((prev) =>
      prev
        ? {
            ...prev,
            timestamp: wsPayload.timestamp,
            pack: wsPayload.pack,
            alarm_count: wsPayload.alarms?.length ?? 0,
            balancing_active_count: wsPayload.balancing?.active_cell_ids?.length ?? 0,
          }
        : null
    )
    setCellGrid((prev) =>
      prev ? { ...prev, timestamp: wsPayload.timestamp, cells: wsPayload.cells } : null
    )
    setBalancingStatus(wsPayload.balancing ?? null)
    setChartPoints((prev) => {
      const next = [...prev, { t: Date.now(), v: wsPayload.pack.voltage, i: wsPayload.pack.current, soc: wsPayload.pack.soc * 100 }]
      return next.slice(-CHART_MAX_POINTS)
    })
  }, [wsPayload])

  const handleToggleBalancing = useCallback(
    async (cellId: number, enabled: boolean) => {
      if (!datasetKey) return
      try {
        await setBalancing(datasetKey, cellId, enabled)
        const bal = await getDashboardBalancingStatus(datasetKey)
        setBalancingStatus(bal)
        if (cellGrid) {
          setCellGrid({
            ...cellGrid,
            cells: cellGrid.cells.map((c) => (c.id === cellId ? { ...c, balancing: enabled } : c)),
          })
        }
      } catch (e) {
        setRestError(e instanceof Error ? e.message : 'Failed to set balancing')
      }
    },
    [datasetKey, cellGrid]
  )

  const cells = cellGrid?.cells ?? []
  const alarmList: AlarmItem[] = alarms?.alarms ?? []
  const alarmMessages = wsPayload?.alarms

  return (
    <div className="bms-dashboard">
      <header className="bms-header">
        <div className="bms-header-title">BMS Dashboard v1 (FastAPI)</div>
        <div className="header-meta">
          <span className={connected ? 'ws-connected' : 'ws-disconnected'}>
            {connected ? '● WS Connected' : '○ WS Disconnected'}
          </span>
          {datasetKey && <span className="dataset-badge">{datasetKey}</span>}
        </div>
      </header>

      {restError && (
        <div className="rest-error">
          {restError}
        </div>
      )}

      <div className="bms-main dashboard-v1">
        <div className="dashboard-center">
          <section className="pack-section">
            <h3>Pack</h3>
            {overview?.pack && (
              <div className="pack-overview">
                <div className="metric-card">
                  <div className="metric-label">Voltage</div>
                  <div className="metric-value">{overview.pack.voltage.toFixed(2)} V</div>
                </div>
                <div className="metric-card">
                  <div className="metric-label">Current</div>
                  <div className="metric-value">{overview.pack.current.toFixed(2)} A</div>
                </div>
                <div className="metric-card">
                  <div className="metric-label">Temp</div>
                  <div className="metric-value">{overview.pack.temp.toFixed(1)} °C</div>
                </div>
                <div className="metric-card">
                  <div className="metric-label">SOC</div>
                  <div className="metric-value">{(overview.pack.soc * 100).toFixed(1)} %</div>
                </div>
                <div className="metric-card">
                  <div className="metric-label">SOH</div>
                  <div className="metric-value">{(overview.pack.soh * 100).toFixed(1)} %</div>
                </div>
              </div>
            )}
          </section>

          <section className="cell-section">
            <h3>Cell Grid</h3>
            <CellGrid
              cells={cells}
              datasetKey={datasetKey}
              onToggleBalancing={handleToggleBalancing}
              disabled={!datasetKey}
            />
          </section>

          <section className="chart-section">
            <h3>Realtime (from WS)</h3>
            <div className="charts-row">
              <RealtimeChart points={chartPoints} metric="v" />
              <RealtimeChart points={chartPoints} metric="i" />
              <RealtimeChart points={chartPoints} metric="soc" />
            </div>
          </section>
        </div>

        <aside className="dashboard-sidebar">
          <BalancingStatus status={balancingStatus} />
          <AlarmPanel alarms={alarmList} alarmMessages={alarmMessages} />
        </aside>
      </div>
    </div>
  )
}
