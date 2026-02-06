/**
 * WorstCellCard — Min/max V, max temp for worst cell.
 */
type WorstCell = {
  cell_id?: number
  voltage?: number | null
  temperature?: number | null
  reason?: string
}

export default function WorstCellCard({ worstCell }: { worstCell?: WorstCell | null }) {
  return (
    <div className="worst-cell-card card">
      <h3 className="card-title">Worst Cell Summary</h3>
      <div className="worst-grid">
        <div className="worst-item">
          <span className="label">Cell</span>
          <span className="value">{worstCell?.cell_id ?? '—'}</span>
        </div>
        <div className="worst-item">
          <span className="label">V</span>
          <span className="value">{worstCell?.voltage != null ? `${worstCell.voltage.toFixed(3)} V` : '—'}</span>
        </div>
        <div className="worst-item">
          <span className="label">T</span>
          <span className="value">{worstCell?.temperature != null ? `${worstCell.temperature.toFixed(1)} °C` : '—'}</span>
        </div>
        <div className="worst-item">
          <span className="label">Reason</span>
          <span className="value">{worstCell?.reason ?? '—'}</span>
        </div>
      </div>
    </div>
  )
}
