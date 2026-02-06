/**
 * CellTable — Columns: Cell | V | T | I | SOC | SoH | Discharge Est | Charge Est.
 * Row click → /cells + cellId highlight.
 */
type CellRow = {
  cell_id: number
  voltage?: number
  temperature?: number
  current?: number
  soc?: number
  soh?: number
  discharge_est?: number
  charge_est?: number
}

export default function CellTable({
  rows,
  onRowClick,
}: {
  rows: CellRow[]
  onRowClick?: (row: CellRow) => void
}) {
  if (rows.length === 0) {
    return (
      <div className="cell-table-card card">
        <h3 className="card-title">Cell Table</h3>
        <div className="empty-state">No cell data. Run NASA MAT ingest first.</div>
      </div>
    )
  }
  return (
    <div className="cell-table-card card">
      <h3 className="card-title">Cell Table</h3>
      <div className="table-wrap">
        <table className="cell-table">
          <thead>
            <tr>
              <th>Cell</th>
              <th>V</th>
              <th>T</th>
              <th>I</th>
              <th>SOC</th>
              <th>SoH</th>
              <th>Discharge Est</th>
              <th>Charge Est</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.cell_id} onClick={() => onRowClick?.(r)}>
                <td>{r.cell_id}</td>
                <td>{r.voltage != null ? r.voltage.toFixed(3) : '—'}</td>
                <td>{r.temperature != null ? r.temperature.toFixed(1) : '—'}</td>
                <td>{r.current != null ? r.current.toFixed(2) : '—'}</td>
                <td>{r.soc != null ? (r.soc <= 1 ? (r.soc * 100).toFixed(1) : r.soc) : '—'}</td>
                <td>{r.soh != null ? (r.soh <= 1 ? (r.soh * 100).toFixed(1) : r.soh) : '—'}</td>
                <td>{r.discharge_est != null ? r.discharge_est : '—'}</td>
                <td>{r.charge_est != null ? r.charge_est : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
