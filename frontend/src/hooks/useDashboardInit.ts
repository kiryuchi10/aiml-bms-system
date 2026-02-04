/**
 * useDashboardInit — REST GET /api/v1/dashboard/vehicle/{vehicleId} for initial state.
 */
import { useEffect, useState } from 'react'
import { getVehicleDashboard } from '../services/dashboardApi'
import type { DashboardResponse } from '../types/bms'

export function useDashboardInit(vehicleId: string) {
  const [data, setData] = useState<DashboardResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getVehicleDashboard(vehicleId)
      .then((d) => {
        if (!cancelled) setData(d)
      })
      .catch((e) => {
        if (!cancelled) setError(String(e))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [vehicleId])

  return { data, loading, error }
}
