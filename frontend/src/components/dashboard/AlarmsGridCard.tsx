/**
 * AlarmsGridCard — 4×4 or 2col alarm type grid; Active/Latched (dot/border).
 * Click → Alarm Center with filter (e.g. severity=critical&type=open_wire).
 */
type Counts = { active?: number; latched?: number }

export default function AlarmsGridCard({
  counts,
  onFilter,
}: {
  counts?: Counts
  onFilter?: (filter: string) => void
}) {
  const active = counts?.active ?? 0
  const latched = counts?.latched ?? 0
  return (
    <div className="alarms-grid-card card">
      <h3 className="card-title">Alarm Summary</h3>
      <div className="alarms-grid-summary">
        <button type="button" className="chip active" onClick={() => onFilter?.('active')}>
          <span className="dot" /> Active: {active}
        </button>
        <button type="button" className="chip latched" onClick={() => onFilter?.('latched')}>
          <span className="dot" /> Latched: {latched}
        </button>
      </div>
      {/* TODO: 4×4 alarm type grid with click → filter */}
    </div>
  )
}
