/**
 * PackMetricsGrid — pack-overview, metric-card; pack voltage/current/status/ambient/pack temp.
 */
import type { DashboardResponse } from '../../types/bms'

function formatNum(v?: number | null, unit?: string): string {
  if (v === undefined || v === null || Number.isNaN(v)) return '-'
  return `${Number(v).toFixed(3)} ${unit ?? ''}`.trim()
}

export function PackMetricsGrid({ pack }: { pack: DashboardResponse['pack'] }) {
  const voltage = pack?.voltage ?? pack?.pack_voltage
  const current = pack?.current ?? pack?.pack_current
  const packTemp = pack?.pack_temp
  const ambientTemp = pack?.ambient_temp

  return (
    <div className="pack-overview">
      <div className="metric-card">
        <div className="metric-label">Pack Voltage</div>
        <div className="metric-value">{formatNum(voltage, 'V')}</div>
      </div>
      <div className="metric-card">
        <div className="metric-label">Pack Current</div>
        <div className="metric-value">{formatNum(current, 'A')}</div>
      </div>
      <div className="metric-card">
        <div className="metric-label">Pack Status</div>
        <div className="metric-value status">{pack?.mode ?? '-'}</div>
      </div>
      <div className="metric-card">
        <div className="metric-label">Ambient Temp</div>
        <div className="metric-value">{formatNum(ambientTemp, '°C')}</div>
      </div>
      <div className="metric-card">
        <div className="metric-label">Pack Temp</div>
        <div className="metric-value">{formatNum(packTemp, '°C')}</div>
      </div>
    </div>
  )
}
