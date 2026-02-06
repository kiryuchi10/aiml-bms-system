/**
 * Lightweight SVG line chart for BMS time-series (Pack V, I, Temp, SOC).
 */

import { useMemo } from 'react'
import styles from './LineChart.module.css'

export type LineChartPoint = { t: number; value: number }

type Props = {
  points: LineChartPoint[]
  label: string
  width?: number
  height?: number
  color?: string
}

export function LineChart({ points, label, width = 320, height = 120, color = '#1976d2' }: Props) {
  const { pathD, minVal, maxVal } = useMemo(() => {
    if (points.length < 2) {
      return { pathD: '', minVal: 0, maxVal: 1 }
    }
    const values = points.map((p) => p.value)
    const minVal = Math.min(...values, 0)
    const maxVal = Math.max(...values, 1) || 1
    const range = maxVal - minVal || 1
    const padding = { left: 36, right: 8, top: 8, bottom: 20 }
    const innerW = width - padding.left - padding.right
    const innerH = height - padding.top - padding.bottom
    const step = innerW / Math.max(points.length - 1, 1)
    const pathD = points
      .map((p, i) => {
        const x = padding.left + i * step
        const y = padding.top + innerH - ((p.value - minVal) / range) * innerH
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
      })
      .join(' ')
    return { pathD, minVal, maxVal }
  }, [points, width, height])

  return (
    <div className={styles.wrap}>
      <div className={styles.label}>{label}</div>
      <svg width={width} height={height} className={styles.svg}>
        <path d={pathD} fill="none" stroke={color} strokeWidth={1.5} />
      </svg>
    </div>
  )
}
