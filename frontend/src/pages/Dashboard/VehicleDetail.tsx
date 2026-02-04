/**
 * VehicleDetail: GET /dashboard/vehicle/{id} + pack-view.
 */
import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getDashboardVehicle, getPackView } from '../../services/dashboardApi'
import { BatteryPackPanel } from '../../components/bms/BatteryPackPanel'

export function VehicleDetail() {
  const { id } = useParams<{ id: string }>()
  const [kpi, setKpi] = useState<{ vehicle_id: number; vin: string; trip_count: number; charging_count: number } | null>(null)
  const [packView, setPackView] = useState<Array<{ cell_id: string; voltage: number | null; temperature: number | null; soc: number | null }>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    const vid = parseInt(id, 10)
    if (Number.isNaN(vid)) return
    setLoading(true)
    setError(null)
    Promise.all([getDashboardVehicle(vid), getPackView(vid)])
      .then(([k, cells]) => {
        setKpi(k)
        setPackView(cells)
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div>Loading...</div>
  if (error) return <div className="error">{error}</div>
  if (!kpi) return <div>Vehicle not found</div>

  return (
    <div className="vehicle-detail">
      <Link to="/dashboard/fleet">← Fleet</Link>
      <h2>{kpi.vin}</h2>
      <p>Trips: {kpi.trip_count} · Charging: {kpi.charging_count}</p>
      <BatteryPackPanel cells={packView} />
    </div>
  )
}
