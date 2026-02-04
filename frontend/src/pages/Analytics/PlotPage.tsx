/**
 * PlotPage — pack metric line chart; metric selector, window 60/300/600, auto refresh.
 */
import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ShellLayout } from '../../components/layout/ShellLayout'
import { useBmsStream } from '../../hooks/useBmsStream'
import { usePlotData } from './usePlotData'
import { LineChart } from './components/LineChart'

const METRICS = [
  { key: 'pack_voltage', label: 'Pack Voltage (V)' },
  { key: 'pack_current', label: 'Pack Current (A)' },
  { key: 'pack_temp', label: 'Pack Temp (°C)' },
  { key: 'ambient_temp', label: 'Ambient Temp (°C)' },
  { key: 'soc', label: 'SoC (%)' },
  { key: 'soh', label: 'SoH (%)' },
]

function useQuery() {
  const { search } = useLocation()
  return useMemo(() => new URLSearchParams(search), [search])
}

export function PlotPage() {
  const nav = useNavigate()
  const q = useQuery()
  const vehicleId = q.get('vehicle_id') ?? (import.meta.env.VITE_VEHICLE_ID ?? 'MBM165-P50-B')
  const initialMetric = q.get('metric') ?? 'pack_voltage'
  const initialWindow = Number(q.get('window') ?? '600')

  const { connected, stale, streaming, start, stop } = useBmsStream()
  const [metric, setMetric] = useState(initialMetric)
  const [windowSec, setWindowSec] = useState(initialWindow)
  const [auto, setAuto] = useState(false)

  const { series, loading, error, refetch } = usePlotData({ vehicleId, metric, windowSec })

  useEffect(() => {
    if (!auto) return
    const t = window.setInterval(() => refetch(), 2000)
    return () => window.clearInterval(t)
  }, [auto, refetch])

  const title = `📊 Plot - ${metric}`

  return (
    <ShellLayout
      title="⚡ MBM165-P50-B GUI - Battery Management System"
      timestamp={new Date().toLocaleString()}
      connected={connected}
      stale={stale}
      streaming={streaming}
      onStart={start}
      onStop={stop}
      onPlot={() => {}}
    >
      <div className="panel-header">{title}</div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <button type="button" className="btn" onClick={() => nav('/dashboard')}>
          ← Back
        </button>
        <button type="button" className="btn" onClick={() => refetch()} disabled={loading}>
          ⟳ Refresh
        </button>
        <label style={{ fontSize: 12, color: '#444', display: 'flex', alignItems: 'center', gap: 4 }}>
          Metric:
          <select
            value={metric}
            onChange={(e) => setMetric(e.target.value)}
            style={{ padding: '6px 8px', borderRadius: 4, border: '1px solid #bbb' }}
          >
            {METRICS.map((m) => (
              <option key={m.key} value={m.key}>
                {m.label}
              </option>
            ))}
          </select>
        </label>
        <div style={{ display: 'flex', gap: 6 }}>
          {[60, 300, 600].map((w) => (
            <button
              key={w}
              type="button"
              className="btn"
              onClick={() => setWindowSec(w)}
              style={windowSec === w ? { outline: '2px solid #0066cc' } : undefined}
            >
              {w}s
            </button>
          ))}
        </div>
        <button type="button" className="btn" onClick={() => setAuto((v) => !v)}>
          {auto ? '⏸ Auto' : '▶ Auto'}
        </button>
        <span style={{ fontSize: 12, color: '#555' }}>
          vehicle_id={vehicleId} | window={windowSec}s
        </span>
      </div>

      {error && (
        <div style={{ marginBottom: 12, padding: 10, border: '1px solid #f44336', borderRadius: 6 }}>
          <b>Error</b>: {error}
        </div>
      )}

      {loading && !series.length && <div>Loading...</div>}
      {!loading && !error && <LineChart points={series} />}
    </ShellLayout>
  )
}
