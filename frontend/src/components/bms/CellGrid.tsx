/**
 * Cell grid: render cells from API/WS data. Click to toggle balancing (calls API).
 */

import type { CellTelemetry } from '../../services/apiV1'
import styles from './CellGrid.module.css'

type Props = {
  cells: CellTelemetry[]
  datasetKey: string | null
  onToggleBalancing?: (cellId: number, enabled: boolean) => void
  disabled?: boolean
}

export function CellGrid({ cells, datasetKey, onToggleBalancing, disabled }: Props) {
  return (
    <div className={styles.grid}>
      <div className={styles.header}>
        <span>Cell</span>
        <span>V (V)</span>
        <span>T (°C)</span>
        <span>Balancing</span>
      </div>
      {cells.map((c) => (
        <div
          key={c.id}
          className={`${styles.cell} ${c.balancing ? styles.balancing : ''} ${c.status !== 'normal' ? styles[c.status] || styles.alert : ''}`}
        >
          <span className={styles.cellId}>{String(c.id).padStart(2, '0')}</span>
          <span>{c.v.toFixed(3)}</span>
          <span>{c.t.toFixed(1)}</span>
          <button
            type="button"
            className={c.balancing ? styles.btnOn : styles.btnOff}
            disabled={disabled || !datasetKey}
            onClick={() => onToggleBalancing?.(c.id, !c.balancing)}
            title={datasetKey ? `Toggle balancing cell ${c.id}` : 'Select dataset'}
          >
            {c.balancing ? 'ON' : 'OFF'}
          </button>
        </div>
      ))}
    </div>
  )
}
