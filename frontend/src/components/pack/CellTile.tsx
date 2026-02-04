import type { CellSnapshot } from '../../lib/bmsApi'

type Props = {
  cell: CellSnapshot
  min: number
  max: number
}

export function CellTile({ cell, min, max }: Props) {
  const range = Math.max(1e-9, max - min)
  const ratio = (cell.value - min) / range
  const pct = Math.min(100, Math.max(0, ratio * 100))

  const glow =
    cell.status === 'WARN'
      ? '0 0 12px rgba(255,255,0,0.35)'
      : cell.status === 'DANGER'
        ? '0 0 12px rgba(255,0,0,0.35)'
        : '0 0 12px rgba(0,255,200,0.15)'

  return (
    <div
      className="cell-tile"
      style={{
        position: 'relative',
        padding: 8,
        borderRadius: 8,
        border: '1px solid rgba(255,255,255,0.25)',
        background: '#0a0a0f',
        boxShadow: glow,
      }}
    >
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>{cell.cell_id}</div>
      <div style={{ fontSize: 18, color: '#fff', fontWeight: 600 }}>{cell.value.toFixed(3)}</div>
      {cell.balancing && (
        <div
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            fontSize: 10,
            padding: '2px 6px',
            borderRadius: 4,
            background: '#0891b2',
            color: '#fff',
          }}
        >
          BAL
        </div>
      )}
      <div
        style={{
          marginTop: 8,
          height: 4,
          borderRadius: 2,
          background: 'rgba(255,255,255,0.1)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            background: 'rgba(255,255,255,0.7)',
            borderRadius: 2,
          }}
        />
      </div>
    </div>
  )
}
