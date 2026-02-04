/**
 * CellGrid — 16 cell cards (battery container); inactive / balancing / alarm; optional onCellClick.
 */
import type { DashboardResponse } from '../../types/bms'

function fmt(v?: number | null, unit?: string, digits = 2): string {
  if (v === undefined || v === null || Number.isNaN(v)) return '-'
  return `${Number(v).toFixed(digits)} ${unit ?? ''}`.trim()
}

export function CellGrid({
  cells,
  onCellClick,
}: {
  cells: DashboardResponse['cells']
  onCellClick?: (cellId: number) => void
}) {
  const map = new Map<number, DashboardResponse['cells'][number]>()
  for (const c of cells ?? []) map.set(c.id, c)

  const slots = Array.from({ length: 16 }, (_, i) => i + 1).map((id) => ({
    id,
    c: map.get(id),
  }))

  return (
    <div className="cell-grid">
      {slots.map(({ id, c }) => {
        const inactive = !c
        const bal = !!c?.bal
        const alarm = !!c?.alarm
        const cls = [
          'cell-card',
          inactive ? 'cell-card--inactive' : '',
          bal ? 'cell-card--bal' : '',
          alarm ? 'cell-card--alarm' : '',
        ]
          .filter(Boolean)
          .join(' ')

        return (
          <div
            key={id}
            className={cls}
            style={{ cursor: inactive ? 'not-allowed' : 'pointer' }}
            onClick={() => {
              if (inactive) return
              onCellClick?.(id)
            }}
            onKeyDown={(e) => {
              if (inactive) return
              if (e.key === 'Enter' || e.key === ' ') onCellClick?.(id)
            }}
            role="button"
            tabIndex={inactive ? undefined : 0}
            title={inactive ? 'No Data' : 'Click to toggle balancing'}
          >
            <div className="cell-card-title">Cell {String(id).padStart(2, '0')}</div>
            <div className="cell-card-v">{inactive ? '-' : fmt(c?.v, 'V', 4)}</div>
            <div className="cell-card-t">{inactive ? 'No Data' : fmt(c?.t, '°C', 2)}</div>
            {bal && <div className="cell-badge cell-badge--bal">BAL</div>}
            {alarm && <div className="cell-badge cell-badge--alarm">ALARM</div>}
          </div>
        )
      })}
    </div>
  )
}
