/**
 * AnalyticsPage — placeholder; features plots (SOC/SOH/Thermal/EIS).
 */
import { useNavigate } from 'react-router-dom'
import { ShellLayout } from '../../components/layout/ShellLayout'
import { useBmsStream } from '../../hooks/useBmsStream'

const DEFAULT_VEHICLE_ID = import.meta.env.VITE_VEHICLE_ID ?? 'MBM165-P50-B'

export function AnalyticsPage() {
  const nav = useNavigate()
  const { connected, stale, streaming, start, stop } = useBmsStream()
  const timestamp = new Date().toLocaleString()
  const onPlot = () =>
    nav(
      `/dashboard/plot?vehicle_id=${encodeURIComponent(DEFAULT_VEHICLE_ID)}&metric=pack_voltage&window=600`
    )

  return (
    <ShellLayout
      title="⚡ MBM165-P50-B GUI - Battery Management System"
      timestamp={timestamp}
      connected={connected}
      stale={stale}
      streaming={streaming}
      onStart={start}
      onStop={stop}
      onPlot={onPlot}
    >
      <div className="panel-header">Analytics</div>
      <div style={{ padding: 12 }}>TODO: features plots (SOC/SOH/Thermal/EIS)</div>
    </ShellLayout>
  )
}
