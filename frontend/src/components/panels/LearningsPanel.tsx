/**
 * LearningsPanel — learnings-section, learning-item; key-value from learnings object.
 */
function human(s: string): string {
  return s.replaceAll('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export function LearningsPanel({ learnings }: { learnings: Record<string, unknown> }) {
  const entries = Object.entries(learnings ?? {}).slice(0, 10)

  return (
    <div className="learnings-section">
      <div className="panel-header" style={{ fontSize: 12, marginBottom: 12 }}>
        Learnings
      </div>

      {entries.length === 0 ? (
        <div className="learning-item">
          <span className="learning-label">No Learnings</span>
          <span className="learning-value">-</span>
        </div>
      ) : (
        entries.map(([k, v]) => (
          <div className="learning-item" key={k}>
            <span className="learning-label">{human(k)}</span>
            <span className="learning-value">{String(v)}</span>
          </div>
        ))
      )}
    </div>
  )
}
