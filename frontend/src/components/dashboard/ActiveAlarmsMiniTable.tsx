/**
 * ActiveAlarmsMiniTable — Recent N alarms + severity color.
 * Click row → Alarm Center (optional filter).
 */
type Alarm = { id?: string; severity?: string; message?: string }

export default function ActiveAlarmsMiniTable({
  alarms,
  onRowClick,
}: {
  alarms?: Alarm[]
  onRowClick?: (alarm: Alarm) => void
}) {
  const list = alarms ?? []
  return (
    <div className="active-alarms-mini card">
      <h3 className="card-title">Active Alarms</h3>
      {list.length === 0 ? (
        <div className="empty-state">No active alarms</div>
      ) : (
        <table className="mini-table">
          <tbody>
            {list.map((a, i) => (
              <tr
                key={a.id ?? i}
                className={`severity-${a.severity ?? 'warning'}`}
                onClick={() => onRowClick?.(a)}
              >
                <td>{a.severity ?? '—'}</td>
                <td>{a.message ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
