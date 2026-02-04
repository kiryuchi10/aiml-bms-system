import type { CellGridResponse } from '../../lib/bmsApi'
import { CellTile } from './CellTile'

type Props = { grid: CellGridResponse | null }

export function CellGrid({ grid }: Props) {
  if (!grid) {
    return (
      <div
        className="cell-grid-placeholder"
        style={{
          minHeight: 280,
          borderRadius: 12,
          border: '1px solid rgba(255,255,255,0.2)',
          background: '#18181b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'rgba(255,255,255,0.5)',
        }}
      >
        Loading cell grid…
      </div>
    )
  }

  return (
    <div
      className="cell-grid"
      style={{
        borderRadius: 12,
        border: '1px solid rgba(255,255,255,0.2)',
        background: '#0a0a0f',
        padding: 16,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
          color: '#fff',
          fontWeight: 600,
        }}
      >
        <span>Cell Grid (Module {grid.module})</span>
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>metric: {grid.metric}</span>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          gap: 12,
        }}
      >
        {grid.cells.map((c) => (
          <CellTile key={c.cell_id} cell={c} min={grid.min} max={grid.max} />
        ))}
      </div>
    </div>
  )
}
