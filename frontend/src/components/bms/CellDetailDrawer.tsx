/**
 * Cell detail drawer: current status, voltage/temperature timeseries, alarm history.
 * Fetches /api/v1/cells/timeseries and uses active-alarms filtered by cell_id.
 */

import { useEffect, useMemo, useState } from 'react'
import { getCellTimeseries, getActiveAlarms, type CellLatestRow, type TimeseriesPoint, type AlarmEventDb } from '../../services/apiV1'
import { RealtimeChart, type ChartPoint } from './RealtimeChart'
import '../../styles/BMSDashboard.css'

const VEHICLE_ID = 1
const HOUR_MS = 60 * 60 * 1000

type Props = {
  cellId: number | null
  cellLatest: CellLatestRow | null
  open: boolean
  onClose: () => void
}

export function CellDetailDrawer({ cellId, cellLatest, open, onClose }: Props) {
  const [voltagePoints, setVoltagePoints] = useState<TimeseriesPoint[]>([])
  const [tempPoints, setTempPoints] = useState<TimeseriesPoint[]>([])
  const [alarms, setAlarms] = useState<AlarmEventDb[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!cellId || !open) return
    setLoading(true)
    const end = new Date()
    const start = new Date(end.getTime() - 24 * HOUR_MS)
    const startStr = start.toISOString()
    const endStr = end.toISOString()
    Promise.all([
      getCellTimeseries(cellId, { vehicleId: VEHICLE_ID, signal: 'voltage', start: startStr, end: endStr, limit: 500 }),
      getCellTimeseries(cellId, { vehicleId: VEHICLE_ID, signal: 'temperature', start: startStr, end: endStr, limit: 500 }),
      getActiveAlarms(VEHICLE_ID, 24),
    ])
      .then(([vRes, tRes, aRes]) => {
        setVoltagePoints(vRes.points ?? [])
        setTempPoints(tRes.points ?? [])
        setAlarms((aRes.alarms ?? []).filter((a) => a.cell_id === cellId))
      })
      .finally(() => setLoading(false))
  }, [cellId, open])

  const chartVoltage: ChartPoint[] = useMemo(
    () => voltagePoints.map((p) => ({ t: new Date(p.ts).getTime(), v: p.value })),
    [voltagePoints]
  )
  const chartTemp: ChartPoint[] = useMemo(
    () => tempPoints.map((p) => ({ t: new Date(p.ts).getTime(), soc: p.value })),
    [tempPoints]
  )

  return (
    <div className={`cell-detail-drawer ${open ? 'open' : ''}`} aria-hidden={!open}>
      <div className="drawer-header">
        <h2>Cell {cellId ?? '—'} Detail</h2>
        <button type="button" className="drawer-close" onClick={onClose} aria-label="Close">
          ×
        </button>
      </div>
      <div className="drawer-content">
        <div className="detail-section">
          <h3>Current Status</h3>
          {cellLatest ? (
            <div className="detail-grid">
              <div className="detail-item">
                <div className="detail-label">Voltage</div>
                <div className="detail-value" style={{ color: '#0066cc' }}>
                  {cellLatest.voltage != null ? `${cellLatest.voltage.toFixed(3)} V` : '—'}
                </div>
              </div>
              <div className="detail-item">
                <div className="detail-label">Temperature</div>
                <div className="detail-value" style={{ color: '#ff6b35' }}>
                  {cellLatest.temperature != null ? `${cellLatest.temperature.toFixed(1)} °C` : '—'}
                </div>
              </div>
              <div className="detail-item">
                <div className="detail-label">Current</div>
                <div className="detail-value" style={{ color: '#9c27b0' }}>
                  {cellLatest.current != null ? `${cellLatest.current.toFixed(3)} A` : '—'}
                </div>
              </div>
              <div className="detail-item">
                <div className="detail-label">SOC</div>
                <div className="detail-value" style={{ color: '#4caf50' }}>
                  {cellLatest.soc != null ? `${(cellLatest.soc * 100).toFixed(1)} %` : '—'}
                </div>
              </div>
            </div>
          ) : (
            <p className="empty-state">No latest data</p>
          )}
        </div>

        <div className="detail-section">
          <h3>Voltage Trend (last 24h)</h3>
          {loading ? (
            <div className="loading-state">Loading…</div>
          ) : chartVoltage.length > 0 ? (
            <RealtimeChart points={chartVoltage} metric="v" width={360} height={180} />
          ) : (
            <div className="timeseries-chart">
              <div style={{ padding: '80px 20px', textAlign: 'center', color: '#999' }}>No voltage data</div>
            </div>
          )}
        </div>

        <div className="detail-section">
          <h3>Temperature Trend (last 24h)</h3>
          {loading ? null : tempPoints.length > 0 ? (
            <RealtimeChart points={chartTemp} metric="temp" width={360} height={180} />
          ) : (
            <div className="timeseries-chart">
              <div style={{ padding: '80px 20px', textAlign: 'center', color: '#999' }}>No temperature data</div>
            </div>
          )}
        </div>

        <div className="detail-section">
          <h3>Alarm History (last 24h)</h3>
          {alarms.length > 0 ? (
            <ul className="alarms-list" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {alarms.map((a) => (
                <li key={a.id} className={`alarm-item severity-${a.severity}`}>
                  <span className="alarm-type">{a.alarm_type}</span>
                  <span className="alarm-value">{a.value != null ? a.value.toFixed(2) : '—'}</span>
                  {a.threshold != null && <span>threshold {a.threshold.toFixed(2)}</span>}
                  {a.rationale && <span className="alarm-rationale">{a.rationale}</span>}
                </li>
              ))}
            </ul>
          ) : (
            <div style={{ background: '#f8f8f8', padding: 12, borderRadius: 4, fontSize: 12 }}>No alarms in the last 24 hours</div>
          )}
        </div>
      </div>
    </div>
  )
}
