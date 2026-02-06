/**
 * Alarm Center: fault list from active-alarms.
 */

import { useEffect, useState } from 'react'
import { getActiveAlarms, type AlarmEventDb } from '../services/apiV1'
import '../styles/BMSDashboard.css'

const VEHICLE_ID = 1

export function AlarmCenterPage() {
  const [alarms, setAlarms] = useState<AlarmEventDb[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getActiveAlarms(VEHICLE_ID, 168)
      .then((r) => setAlarms(r.alarms ?? []))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="bms-dashboard page-body-inner">
        <div className="loading-state">Loading…</div>
      </div>
    )
  }

  return (
    <div className="bms-dashboard page-body-inner">
      <h1 className="page-title">Alarm Center</h1>
      <section className="active-alarms-section">
        <h2 className="section-label">Active Alarms (last 7 days)</h2>
        {alarms.length > 0 ? (
          <ul className="alarms-list" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {alarms.map((a) => (
              <li key={a.id} className={`alarm-item severity-${a.severity}`}>
                <span className="alarm-type">{a.alarm_type}</span>
                <span className="alarm-value">{a.value != null ? a.value.toFixed(2) : '—'}</span>
                <span>threshold {a.threshold != null ? a.threshold.toFixed(2) : '—'}</span>
                {a.cell_id != null && <span className="alarm-cell">Cell {a.cell_id}</span>}
                {a.rationale && <span className="alarm-rationale">{a.rationale}</span>}
              </li>
            ))}
          </ul>
        ) : (
          <div className="empty-state">No active alarms</div>
        )}
      </section>
    </div>
  )
}
