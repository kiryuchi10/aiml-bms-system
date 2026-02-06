/**
 * Realtime Monitor: WS ws://localhost:8000/ws/bms?dataset=B0005&hz=1.
 * BmsStreamContext, sliding window (60/120/240), 4 LineCharts: Pack V, I, Temp, SOC.
 */

import { useBmsStreamContext } from '../context/BmsStreamContext'
import { LineChart, type LineChartPoint } from '../components/charts/LineChart'
import '../styles/BMSDashboard.css'

export function RealtimeMonitorPage() {
  const { connected, error, window: windowPoints, maxPoints, setMaxPoints, connect, disconnect, isStreaming } = useBmsStreamContext()

  const voltagePoints: LineChartPoint[] = windowPoints.map((p) => ({ t: p.t, value: p.v }))
  const currentPoints: LineChartPoint[] = windowPoints.map((p) => ({ t: p.t, value: p.i }))
  const tempPoints: LineChartPoint[] = windowPoints.map((p) => ({ t: p.t, value: p.temp }))
  const socPoints: LineChartPoint[] = windowPoints.map((p) => ({ t: p.t, value: p.soc }))

  return (
    <div className="bms-dashboard page-body-inner realtime-monitor">
      <h1 className="page-title">Realtime Monitor</h1>
      <div className="ws-control">
        <span className={`ws-status ${connected ? 'connected' : 'disconnected'}`}>
          {connected ? '● Connected' : '○ Disconnected'}
        </span>
        <button type="button" className="control-btn start" onClick={() => connect('B0005', 1)} disabled={isStreaming}>
          Start
        </button>
        <button type="button" className="control-btn" onClick={() => disconnect()} disabled={!isStreaming}>
          Stop
        </button>
        <select
          value={maxPoints}
          onChange={(e) => setMaxPoints(Number(e.target.value) as 60 | 120 | 240)}
          className="filter-select"
        >
          <option value={60}>60 points</option>
          <option value={120}>120 points</option>
          <option value={240}>240 points</option>
        </select>
      </div>
      {error && <div className="error-state">{error}</div>}
      <p style={{ fontSize: 12, color: '#666', marginBottom: 16 }}>
        WS: ws://host/ws/bms?dataset=B0005&hz=1 — requires backend/data/B0005.mat (or parquet).
      </p>
      <div className="charts-row four-charts">
        <LineChart points={voltagePoints} label="Pack Voltage (V)" width={320} height={160} color="#1976d2" />
        <LineChart points={currentPoints} label="Pack Current (A)" width={320} height={160} color="#9c27b0" />
        <LineChart points={tempPoints} label="Pack Temperature (°C)" width={320} height={160} color="#ff6b35" />
        <LineChart points={socPoints} label="SOC (%)" width={320} height={160} color="#2e7d32" />
      </div>
    </div>
  )
}
