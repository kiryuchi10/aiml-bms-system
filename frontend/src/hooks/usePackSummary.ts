import { useEffect, useState } from 'react'
import { getPackSummary, type PackSummary } from '../lib/bmsApi'

export function usePackSummary(packId = 'B0005') {
  const [data, setData] = useState<PackSummary | null>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    let alive = true

    async function tick() {
      try {
        const j = await getPackSummary(packId)
        if (alive) setData(j)
      } catch (e) {
        if (alive) setErr(e instanceof Error ? e.message : String(e))
      }
    }

    tick()
    const id = setInterval(tick, 1500)
    return () => {
      alive = false
      clearInterval(id)
    }
  }, [packId])

  return { data, err }
}
