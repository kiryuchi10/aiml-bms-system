/**
 * usePlotData — GET /api/v1/plot/pack?vehicle_id=&metric=&window= for line chart; refetch() for refresh/auto.
 */
import { useCallback, useEffect, useState } from 'react'
import { apiGet } from '../../services/api'

export type PlotPoint = { ts: string; value: number }

export function usePlotData({
  vehicleId,
  metric,
  windowSec,
}: {
  vehicleId: string
  metric: string
  windowSec: number
}) {
  const [series, setSeries] = useState<PlotPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(() => {
    setLoading(true)
    setError(null)
    const url = `/api/v1/plot/pack?vehicle_id=${encodeURIComponent(vehicleId)}&metric=${encodeURIComponent(metric)}&window=${windowSec}`
    apiGet<{ metric: string; points: PlotPoint[] }>(url)
      .then((d) => setSeries(d.points ?? []))
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false))
  }, [vehicleId, metric, windowSec])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { series, loading, error, refetch: fetchData }
}
