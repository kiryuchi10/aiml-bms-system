import type { PackSummary } from '../../lib/bmsApi'

const alarmClass: Record<string, string> = {
  DANGER: 'status-strip-badge status-strip-badge--danger',
  WARN: 'status-strip-badge status-strip-badge--warn',
  NORMAL: 'status-strip-badge status-strip-badge--normal',
}

type Props = { summary: PackSummary | null }

export function StatusStrip({ summary }: Props) {
  if (!summary) {
    return (
      <div className="status-strip" style={stripStyle}>
        <div className="status-strip-placeholder">Loading pack summary…</div>
      </div>
    )
  }

  const badgeClass = alarmClass[summary.alarm_level] ?? alarmClass.NORMAL

  return (
    <div className="status-strip" style={stripStyle}>
      <div className={badgeClass}>{summary.alarm_level}</div>
      <div className="status-strip-item">SOC: {(summary.soc * 100).toFixed(1)}%</div>
      <div className="status-strip-item">SOH: {(summary.soh * 100).toFixed(1)}%</div>
      <div className="status-strip-item">SOP: {summary.sop_kw.toFixed(1)} kW</div>
      <div className="status-strip-item" style={{ marginLeft: 'auto' }}>
        V: {summary.v_pack.toFixed(2)} V / I: {summary.i_pack.toFixed(2)} A / Tmax: {summary.t_max.toFixed(1)} °C
      </div>
    </div>
  )
}

const stripStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '8px 16px',
  minHeight: 48,
  background: '#0a0a0f',
  borderRadius: 12,
  border: '1px solid rgba(255,255,255,0.2)',
  color: 'rgba(255,255,255,0.9)',
  fontSize: 14,
}
