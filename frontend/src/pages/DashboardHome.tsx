/**
 * Dashboard Home: GET /api/v1/dashboard/overview (pack + alarms).
 * Layout: PackOverviewTiles (5), Soc + Worst Cell Summary card, AlarmsGridCard (right).
 */

import { useEffect, useState } from 'react'
import { getDashboardOverview, getDashboardAlarms, type DashboardOverview, type AlarmItem } from '../services/apiV1'
import '../styles/BMSDashboard.css'

const MAX_ALARMS = 10

export function DashboardHome() {
  const [overview, setOverview] = useState<DashboardOverview | null>(null)
  const [alarms, setAlarms] = useState<AlarmItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    Promise.all([getDashboardOverview(), getDashboardAlarms()])
      .then(([o, a]) => {
        if (!cancelled) {
          setOverview(o)
          setAlarms((a?.alarms ?? []).slice(0, MAX_ALARMS))
        }
      })
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [])

  if (loading) {
    return (
      <div className="bms-dashboard page-body-inner">
        <div className="loading-state">Loading dashboard…</div>
      </div>
    )
  }
  if (error) {
    return (
      <div className="bms-dashboard page-body-inner">
        <div className="error-state">{error}</div>
      </div>
    )
  }

  const pack = overview?.pack
  const socPct = pack ? (pack.soc <= 1 ? pack.soc * 100 : pack.soc) : null
  const sohPct = pack ? (pack.soh <= 1 ? pack.soh * 100 : pack.soh) : null

  return (
    <div className="bms-dashboard page-body-inner dashboard-home dashboard-home-layout">
      <h1 className="page-title">Dashboard Home</h1>

      {/* PackOverviewTiles: 5 tiles - gridTemplateColumns: repeat(5, 1fr) */}
      <section className="pack-overview-tiles">
        <h2 className="section-label">Pack Overview</h2>
        {pack ? (
          <div className="tiles-row five-tiles">
            <div className="tile">
              <span className="tile-label">Pack Voltage</span>
              <span className="tile-value">{pack.voltage != null ? `${pack.voltage.toFixed(2)} V` : '—'}</span>
            </div>
            <div className="tile">
              <span className="tile-label">Current</span>
              <span className="tile-value">{pack.current != null ? `${pack.current.toFixed(2)} A` : '—'}</span>
            </div>
            <div className="tile">
              <span className="tile-label">Status</span>
              <span className="tile-value status">{pack.status || '—'}</span>
            </div>
            <div className="tile">
              <span className="tile-label">Ambient Temp</span>
              <span className="tile-value">{pack.temp != null ? `${pack.temp.toFixed(1)} °C` : '—'}</span>
            </div>
            <div className="tile">
              <span className="tile-label">Pack Temp</span>
              <span className="tile-value">{pack.temp != null ? `${pack.temp.toFixed(1)} °C` : '—'}</span>
            </div>
          </div>
        ) : (
          <div className="empty-state">No pack data. Add backend/data/B0005.mat (or parquet).</div>
        )}
      </section>

      {/* SocGaugeCard simplified: SOC tile + Worst Cell Summary card */}
      <section className="soc-worst-row">
        <div className="soc-tile">
          <span className="tile-label">SOC</span>
          <span className="tile-value soc">{socPct != null ? `${socPct.toFixed(1)} %` : '—'}</span>
        </div>
        <div className="worst-cell-summary-card">
          <h3 className="card-title">Worst Cell Summary</h3>
          <div className="worst-grid">
            <div className="worst-item"><span className="label">SoC</span><span className="value">{socPct != null ? `${socPct.toFixed(1)} %` : '—'}</span></div>
            <div className="worst-item"><span className="label">SoH</span><span className="value">{sohPct != null ? `${sohPct.toFixed(1)} %` : '—'}</span></div>
            <div className="worst-item"><span className="label">Imbalance</span><span className="value">{pack?.min_cell_v != null && pack?.max_cell_v != null ? `${((pack.max_cell_v - pack.min_cell_v) * 1000).toFixed(0)} mV` : '—'}</span></div>
            <div className="worst-item"><span className="label">Active Alarms</span><span className="value">{overview?.alarm_count ?? 0}</span></div>
          </div>
        </div>
      </section>

      {/* AlarmsGridCard: right panel - recent N alarms */}
      <section className="alarms-grid-card">
        <h2 className="section-label">Recent Alarms</h2>
        {alarms.length > 0 ? (
          <ul className="alarms-list">
            {alarms.map((a, i) => (
              <li key={a.id || i} className={`alarm-item severity-${a.severity || 'warning'}`}>
                <span className="alarm-type">{a.id || '—'}</span>
                <span className="alarm-message">{a.message}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="empty-state">No recent alarms</div>
        )}
      </section>
    </div>
  )
}
