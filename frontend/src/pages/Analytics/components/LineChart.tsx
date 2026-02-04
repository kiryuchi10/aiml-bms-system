/**
 * LineChart — simple SVG line chart (no external chart lib).
 */
export function LineChart({ points }: { points: Array<{ ts: string; value: number }> }) {
  const w = 980
  const h = 320
  const pad = 40

  if (!points || points.length < 2) {
    return (
      <div style={{ padding: 12 }}>Not enough data to plot.</div>
    )
  }

  const ys = points.map((p) => p.value)
  const xMax = points.length - 1
  const yMin = Math.min(...ys)
  const yMax = Math.max(...ys)
  const yRange = yMax - yMin || 1

  const scaleX = (x: number) => pad + (x / (xMax || 1)) * (w - pad * 2)
  const scaleY = (y: number) => h - pad - ((y - yMin) / yRange) * (h - pad * 2)

  const d = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(i)} ${scaleY(p.value)}`)
    .join(' ')

  return (
    <div style={{ overflowX: 'auto' }}>
      <svg
        width={w}
        height={h}
        style={{ background: 'white', border: '1px solid #ddd', borderRadius: 6 }}
      >
        <line x1={pad} y1={pad} x2={pad} y2={h - pad} stroke="#999" />
        <line x1={pad} y1={h - pad} x2={w - pad} y2={h - pad} stroke="#999" />
        <path d={d} fill="none" stroke="#0066cc" strokeWidth={2} />
        <text x={8} y={pad + 4} fontSize={10} fill="#555">
          {yMax.toFixed(3)}
        </text>
        <text x={8} y={h - pad} fontSize={10} fill="#555">
          {yMin.toFixed(3)}
        </text>
      </svg>
    </div>
  )
}
