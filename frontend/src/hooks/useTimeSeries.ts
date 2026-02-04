import { useEffect, useState } from 'react'
import { getTimeseries, type TimeseriesResponse } from '../lib/bmsApi'

export function useTimeSeries(
  packId: string,
  metric: 'voltage' | 'current' | 'temperature' | 'soc' = 'voltage',
  points = 300
) {
  const [data, setData] = useState<TimeseriesResponse | null>(null)

  useEffect(() => {
    let alive = true

    async function tick() {
      try {
        const j = await getTimeseries(packId, metric, points)
        if (alive) setData(j)
      } catch {
        if (alive) setData(null)
      }
    }

    tick()
    const id = setInterval(tick, 2000)
    return () => {
      alive = false
      clearInterval(id)
    }
  }, [packId, metric, points])

  return data
}
