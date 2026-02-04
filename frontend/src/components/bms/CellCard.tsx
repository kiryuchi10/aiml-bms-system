/**
 * CellCard: single cell display (voltage, temp, SoC).
 */
export function CellCard({
  cellId,
  voltage,
  temperature,
  soc,
}: {
  cellId: string
  voltage: number | null
  temperature: number | null
  soc: number | null
}) {
  return (
    <div className="cell-card">
      <div className="cell-card-id">{cellId}</div>
      <div className="cell-card-v">{voltage != null ? `${voltage.toFixed(2)} V` : '—'}</div>
      <div className="cell-card-t">{temperature != null ? `${temperature.toFixed(1)} °C` : '—'}</div>
      <div className="cell-card-soc">{soc != null ? `SoC ${soc.toFixed(1)}%` : '—'}</div>
    </div>
  )
}
