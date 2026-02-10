/**
 * Alarm Center: list from /api/v1/alarms, detail with evidence, ACK.
 */

import { useCallback, useEffect, useState } from 'react'
import {
  getAlarmsList,
  getAlarmDetail,
  postAlarmAck,
  type AlarmEventDb,
  type AlarmDetail,
} from '../services/apiV1'
import '../styles/BMSDashboard.css'

const VEHICLE_ID = 1

export function AlarmCenterPage() {
  const [alarms, setAlarms] = useState<AlarmEventDb[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [detail, setDetail] = useState<AlarmDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [ackBusy, setAckBusy] = useState(false)

  const loadAlarms = useCallback(() => {
    setLoading(true)
    getAlarmsList(VEHICLE_ID, 168)
      .then((r) => setAlarms(r.alarms ?? []))
      .catch(() => setAlarms([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    loadAlarms()
  }, [loadAlarms])

  useEffect(() => {
    if (selectedId == null) {
      setDetail(null)
      return
    }
    setDetailLoading(true)
    getAlarmDetail(selectedId)
      .then(setDetail)
      .catch(() => setDetail(null))
      .finally(() => setDetailLoading(false))
  }, [selectedId])

  const handleAck = useCallback(() => {
    if (selectedId == null || ackBusy) return
    setAckBusy(true)
    postAlarmAck(selectedId, 'operator')
      .then(() => {
        setDetail((d) => (d ? { ...d, acknowledged_at: new Date().toISOString(), acknowledged_by: 'operator' } : null))
        loadAlarms()
      })
      .finally(() => setAckBusy(false))
  }, [selectedId, ackBusy, loadAlarms])

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
        <h2 className="section-label">Active Alarms (last 7 days) — /api/v1/alarms</h2>
        {alarms.length > 0 ? (
          <ul className="alarms-list" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {alarms.map((a) => (
              <li
                key={a.id}
                className={`alarm-item severity-${a.severity}`}
                style={{ cursor: 'pointer', background: selectedId === a.id ? 'rgba(255,255,255,0.08)' : undefined }}
                onClick={() => setSelectedId(a.id)}
              >
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

      {selectedId != null && (
        <section className="alarm-detail-section" style={{ marginTop: 24, padding: 16, background: 'rgba(0,0,0,0.2)', borderRadius: 8 }}>
          <h3 className="section-label">Alarm detail</h3>
          {detailLoading ? (
            <div className="loading-state">Loading…</div>
          ) : detail ? (
            <>
              <p><strong>{detail.alarm_type}</strong> — {detail.rationale ?? ''}</p>
              <p>Recommended: {detail.recommended_action}</p>
              {detail.evidence?.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <strong>Evidence:</strong>
                  <ul style={{ marginTop: 4 }}>
                    {detail.evidence.map((e) => (
                      <li key={e.id}>{e.reason_type}: {e.description ?? (e.model_name ?? e.rule_id ?? '—')}</li>
                    ))}
                  </ul>
                </div>
              )}
              {detail.acknowledged_at ? (
                <p style={{ color: '#7CFF6B' }}>Acknowledged at {detail.acknowledged_at} by {detail.acknowledged_by ?? '—'}</p>
              ) : (
                <button type="button" className="control-btn start" onClick={handleAck} disabled={ackBusy}>
                  {ackBusy ? 'Acking…' : 'Acknowledge'}
                </button>
              )}
              <button type="button" className="control-btn" style={{ marginLeft: 8 }} onClick={() => setSelectedId(null)}>Close</button>
            </>
          ) : (
            <p>Failed to load detail.</p>
          )}
        </section>
      )}
    </div>
  )
}
