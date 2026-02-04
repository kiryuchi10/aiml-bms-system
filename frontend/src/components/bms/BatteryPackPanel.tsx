/**
 * BatteryPackPanel: cell grid for "Battery pack information".
 */
import { CellCard } from './CellCard'

export type CellLike = {
  cell_id: string
  voltage: number | null
  temperature: number | null
  soc: number | null
}

export function BatteryPackPanel({ cells }: { cells: CellLike[] }) {
  return (
    <div className="battery-pack-panel">
      <div className="cell-grid">
        {cells.map((c) => (
          <CellCard key={c.cell_id} cellId={c.cell_id} voltage={c.voltage} temperature={c.temperature} soc={c.soc} />
        ))}
      </div>
    </div>
  )
}
