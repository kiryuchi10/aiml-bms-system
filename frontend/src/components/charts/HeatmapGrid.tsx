/**
 * Heatmap grid: normal=green, warning=yellow, fault=red.
 */

import styles from './HeatmapGrid.module.css'

type Props = {
  values: number[]
  status: string[]
  label: string
  valueLabel?: (v: number) => string
}

const statusColor = (s: string): string => {
  if (s === 'normal') return '#4caf50'
  if (s === 'warning') return '#ff9800'
  if (s === 'fault' || s === 'critical') return '#f44336'
  return '#9e9e9e'
}

export function HeatmapGrid({ values, status, label, valueLabel = (v) => v.toFixed(1) }: Props) {
  return (
    <div className={styles.wrap}>
      <div className={styles.label}>{label}</div>
      <div className={styles.grid}>
        {values.map((v, i) => (
          <div
            key={i}
            className={styles.cell}
            style={{ background: statusColor(status[i] ?? 'normal') }}
            title={`${valueLabel(v)} (${status[i] ?? 'normal'})`}
          >
            {valueLabel(v)}
          </div>
        ))}
      </div>
    </div>
  )
}
