/**
 * TimeSeriesChart: placeholder for GET /telemetry/{id}/timeseries.
 */
export function TimeSeriesChart({ data }: { data: Array<{ ts: string; value: number }> }) {
  return (
    <div className="chart time-series">
      <div className="chart-title">Time series</div>
      <div className="chart-placeholder">{data.length} points</div>
    </div>
  )
}
