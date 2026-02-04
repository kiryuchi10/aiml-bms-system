/**
 * HistogramChart: placeholder for distribution.
 */
export function HistogramChart({ data }: { data: number[] }) {
  return (
    <div className="chart histogram">
      <div className="chart-title">Histogram</div>
      <div className="chart-placeholder">{data.length} bins</div>
    </div>
  )
}
