/**
 * Cell detail drawer: current status, voltage/temp trends, alarm history.
 * Uses fetchCellDetail (telemetryApi) — spec: current + series + alarm_history.
 */

import { useEffect, useState } from 'react'
import { fetchCellDetail, type CellDetailResponse } from '../../services/telemetryApi'

type Props = {
  packId: string
  cellId: number | null
  open: boolean
  onClose: () => void
}

export function CellDetailDrawer({ packId, cellId, open, onClose }: Props) {
  const [data, setData] = useState<CellDetailResponse | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open || !cellId) return
    let cancelled = false
    setLoading(true)
    setData(null)
    fetchCellDetail(packId, cellId, 60)
      .then((d) => {
        if (!cancelled) setData(d)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [open, cellId, packId])

  return (
    <div className={`cell-detail-drawer ${open ? 'open' : ''}`} aria-hidden={!open}>
      <div className="drawer-header">
        <h2>Cell Detail {cellId ? `#${String(cellId).padStart(2, '0')}` : ''}</h2>
        <button type="button" className="drawer-close" onClick={onClose} aria-label="Close">
          ×
        </button>
      </div>

      <div className="drawer-content">
        {loading && <div style={{ padding: 12 }}>Loading...</div>}

        {!loading && data && (
          <>
            <section className="detail-section">
              <h3>Current Status</h3>
              <div className="detail-grid">
                <DetailItem label="Voltage" value={`${data.current.voltage_v.toFixed(3)} V`} />
                <DetailItem label="Temperature" value={`${data.current.temp_c.toFixed(1)} °C`} />
                <DetailItem label="Current" value={`${data.current.current_a.toFixed(3)} A`} />
                <DetailItem label="SOC" value={`${data.current.soc.toFixed(0)}%`} />
                <DetailItem label="SOH" value={`${data.current.soh.toFixed(0)}%`} />
                <DetailItem label="Internal R" value={`${data.current.internal_r_mohm.toFixed(0)} mΩ`} />
              </div>
            </section>

            <section className="detail-section">
              <h3>Voltage Trend (Last 1 Hour)</h3>
              <div className="timeseries-chart">
                {/* TODO: Chart.js/Recharts line chart using data.series */}
                <div style={{ padding: '80px 20px', textAlign: 'center', color: '#999' }}>
                  TODO: Voltage trend chart<br />
                  points: {data.series.ts.length}
                </div>
              </div>
            </section>

            <section className="detail-section">
              <h3>Temperature Trend (Last 1 Hour)</h3>
              <div className="timeseries-chart">
                <div style={{ padding: '80px 20px', textAlign: 'center', color: '#999' }}>
                  TODO: Temperature trend chart<br />
                  points: {data.series.ts.length}
                </div>
              </div>
            </section>

            <section className="detail-section">
              <h3>Alarm History</h3>
              {data.alarm_history.length === 0 ? (
                <div style={{ background: '#f8f8f8', padding: 12, borderRadius: 4, fontSize: 12 }}>
                  No alarms in the last 24 hours
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {data.alarm_history.map((a, idx) => (
                    <div key={idx} style={{ border: '1px solid #eee', padding: 10, borderRadius: 6 }}>
                      <div style={{ fontWeight: 700 }}>{a.title} ({a.severity})</div>
                      <div style={{ fontSize: 12, color: '#666' }}>{a.ts}</div>
                      <div style={{ fontSize: 12 }}>{a.rationale}</div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        {!loading && open && !data && (
          <div style={{ padding: 12, color: '#999' }}>No detail data.</div>
        )}
      </div>
    </div>
  )
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="detail-item">
      <div className="detail-label">{label}</div>
      <div className="detail-value">{value}</div>
    </div>
  )
}
