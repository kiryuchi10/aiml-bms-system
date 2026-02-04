/**
 * BMS Pack Dashboard: Status Strip + Cell Grid + Fault panel + Charts placeholder.
 * Data: /api/pack/summary, /api/cells/grid, /api/timeseries (parquet → Feature Store → JSON).
 */
import { useState } from 'react'
import { usePackSummary } from '../hooks/usePackSummary'
import { useCellGrid } from '../hooks/useCellGrid'
import { useTimeSeries } from '../hooks/useTimeSeries'
import { StatusStrip } from '../components/pack/StatusStrip'
import { CellGrid } from '../components/pack/CellGrid'

const layoutStyle: React.CSSProperties = {
  padding: 16,
  minHeight: '100vh',
  background: '#18181b',
  color: 'rgba(255,255,255,0.9)',
}

export function DashboardPage() {
  const packId = 'B0005'
  const [metric, setMetric] = useState<'voltage' | 'temperature' | 'resistance'>('voltage')

  const { data: summary } = usePackSummary(packId)
  const grid = useCellGrid(packId, 1, metric)
  const series = useTimeSeries(packId, 'voltage', 300)

  return (
    <div className="bms-dashboard-page" style={layoutStyle}>
      <StatusStrip summary={summary ?? null} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: 16, marginTop: 16 }}>
        {/* Left: Nav */}
        <div
          style={{
            borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.2)',
            background: '#0a0a0f',
            padding: 16,
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Controls</div>
          <button
            type="button"
            style={btnStyle}
            onClick={() => setMetric('voltage')}
          >
            Voltage
          </button>
          <button
            type="button"
            style={btnStyle}
            onClick={() => setMetric('temperature')}
          >
            Temperature
          </button>
          <button
            type="button"
            style={btnStyle}
            onClick={() => setMetric('resistance')}
          >
            Resistance
          </button>
        </div>

        {/* Center: Cell Grid */}
        <CellGrid grid={grid} />

        {/* Right: Fault / IO */}
        <div
          style={{
            borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.2)',
            background: '#0a0a0f',
            padding: 16,
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Fault / IO</div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>Contactor: CLOSED</div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>Isolation: OK</div>
          <div style={{ marginTop: 12, fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Trip Log (placeholder)</div>
          <div
            style={{
              marginTop: 8,
              height: 160,
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.1)',
              background: '#18181b',
            }}
          />
        </div>
      </div>

      {/* Bottom: Charts */}
      <div
        style={{
          marginTop: 16,
          borderRadius: 12,
          border: '1px solid rgba(255,255,255,0.2)',
          background: '#0a0a0f',
          padding: 16,
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: 8 }}>Charts</div>
        <div
          style={{
            height: 256,
            borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.1)',
            background: '#18181b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'rgba(255,255,255,0.4)',
          }}
        >
          {series?.rows?.length
            ? `Timeseries: ${series.rows.length} points (voltage)`
            : 'Timeseries placeholder — connect API'}
        </div>
      </div>
    </div>
  )
}

const btnStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  marginTop: 8,
  padding: '8px 12px',
  borderRadius: 8,
  border: '1px solid rgba(255,255,255,0.2)',
  background: 'transparent',
  color: '#fff',
  cursor: 'pointer',
  fontSize: 14,
}
