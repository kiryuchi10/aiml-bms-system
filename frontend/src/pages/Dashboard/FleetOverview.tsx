/**
 * FleetOverview: fleet cards from GET /dashboard/fleet.
 */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getFleet } from '../../services/dashboardApi'
import type { FleetCard } from '../../services/dashboardApi'

export function FleetOverview() {
  const [fleet, setFleet] = useState<FleetCard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getFleet()
      .then(setFleet)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div>Loading fleet...</div>
  if (error) return <div className="error">{error}</div>

  return (
    <div className="fleet-overview">
      <h2>Fleet Overview</h2>
      <div className="fleet-cards">
        {fleet.map((v) => (
          <Link key={v.vehicle_id} to={`/dashboard/vehicle/${v.vehicle_id}`} className="fleet-card">
            <div className="fleet-card-vin">{v.vin}</div>
            <div className="fleet-card-name">{v.name ?? '—'}</div>
            <div className="fleet-card-meta">Trips: {v.trip_count} · Charging: {v.charging_count}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}
