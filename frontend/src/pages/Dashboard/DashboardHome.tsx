/**
 * DashboardHome: "Battery pack information" main screen.
 * Fetches GET /dashboard/vehicle/{id} and GET /dashboard/vehicle/{id}/pack-view (vehicle from URL or first fleet).
 */
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getFleet, getDashboardVehicle, getPackView } from '../../services/dashboardApi'
import { BatteryPackPanel } from '../../components/bms/BatteryPackPanel'
import { CanLinkStatus } from '../../components/bms/CanLinkStatus'
import { SignalTile } from '../../components/bms/SignalTile'

export function DashboardHome() {
  const { id } = useParams<{ id: string }>()
  const [vehicleId, setVehicleId] = useState<number | null>(id ? parseInt(id, 10) : null)
  const [packView, setPackView] = useState<Array<{ cell_id: string; voltage: number | null; temperature: number | null; soc: number | null }>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const fleet = await getFleet()
        const vid = vehicleId ?? (fleet[0]?.vehicle_id ?? null)
        if (vid == null) {
          setPackView([])
          setVehicleId(null)
          return
        }
        if (!cancelled) setVehicleId(vid)
        const [kpi, cells] = await Promise.all([
          getDashboardVehicle(vid),
          getPackView(vid),
        ])
        if (!cancelled) setPackView(cells)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [vehicleId])

  if (loading) return <div className="dashboard-loading">Loading...</div>
  if (error) return <div className="dashboard-error">{error}</div>

  return (
    <div className="dashboard-home">
      <div className="dashboard-home-left">
        <CanLinkStatus connected={true} />
      </div>
      <div className="dashboard-home-center">
        <h2>Battery pack information</h2>
        <BatteryPackPanel cells={packView} />
      </div>
      <div className="dashboard-home-right">
        <SignalTile label="Current" value={0} unit="A" />
        <SignalTile label="Voltage" value={0} unit="V" />
        <SignalTile label="Temperature" value={0} unit="°C" />
      </div>
    </div>
  )
}
