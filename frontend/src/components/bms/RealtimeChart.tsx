/**
 * Simple realtime chart: last N points of pack voltage / current / SOC from WS.
 */

import { useMemo } from 'react'
import styles from './RealtimeChart.module.css'

export type ChartPoint = { t: number; v?: number; i?: number; soc?: number; temp?: number }

type Props = {
  points: ChartPoint[]
  metric: 'v' | 'i' | 'soc' | 'temp'
  width?: number
  height?: number
}

const METRIC_LABELS: Record<string, string> = {
  v: 'Voltage (V)',
  i: 'Current (A)',
  soc: 'SOC (%)',
  temp: 'Temperature (°C)',
}

export function RealtimeChart({ points, metric, width = 400, height = 120 }: Props) {
  const label = METRIC_LABELS[metric] ?? metric
  const values = useMemo(() => points.map((p) => p[metric] ?? 0), [points, metric])
  const minVal = Math.min(...values, 0)
  const maxVal = Math.max(...values, 1) || 1
  const range = maxVal - minVal || 1
  const padding = { left: 40, right: 10, top: 10, bottom: 24 }
  const innerW = width - padding.left - padding.right
  const innerH = height - padding.top - padding.bottom

  const pathD = useMemo(() => {
    if (values.length < 2) return ''
    const step = innerW / Math.max(values.length - 1, 1)
    return values
      .map((y, i) => {
        const x = padding.left + i * step
        const ny = padding.top + innerH - ((y - minVal) / range) * innerH
        return `${i === 0 ? 'M' : 'L'} ${x} ${ny}`
      })
      .join(' ')
  }, [values, minVal, range, innerW, innerH, padding.left, padding.top])

  return (
    <div className={styles.wrap}>
      <div className={styles.label}>{label}</div>
      <svg width={width} height={height} className={styles.svg}>
        <line
          x1={padding.left}
          y1={padding.top}
          x2={padding.left}
          y2={padding.top + innerH}
          stroke="#ddd"
          strokeWidth="1"
        />
        <line
          x1={padding.left}
          y1={padding.top + innerH}
          x2={width - padding.right}
          y2={padding.top + innerH}
          stroke="#ddd"
          strokeWidth="1"
        />
        <path d={pathD} fill="none" stroke="#1976d2" strokeWidth="1.5" />
      </svg>
    </div>
  )
}
