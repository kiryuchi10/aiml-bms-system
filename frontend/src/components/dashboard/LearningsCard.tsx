/**
 * LearningsCard — Calibration / learned params (CC current, end current, heat transfer…).
 * Purpose: operator checks “model/params updated”.
 */
type Learning = { key: string; value: string | number }

export default function LearningsCard({ items }: { items?: Learning[] }) {
  const list = items ?? []
  return (
    <div className="learnings-card card">
      <h3 className="card-title">Learnings</h3>
      {list.length === 0 ? (
        <div className="empty-state">No learnings</div>
      ) : (
        <ul className="learnings-list">
          {list.map((item) => (
            <li key={item.key}>
              <span className="key">{item.key}</span>
              <span className="value">{String(item.value)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
