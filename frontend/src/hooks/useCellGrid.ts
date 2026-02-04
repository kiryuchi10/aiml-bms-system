import { useEffect, useState } from 'react'
import { getCellGrid, type CellGridResponse } from '../lib/bmsApi'

export function useCellGrid(
  packId: string,
  module = 1,
  metric: 'voltage' | 'temperature' | 'resistance' = 'voltage'
) {
  const [grid, setGrid] = useState<CellGridResponse | null>(null)

  useEffect(() => {
    let alive = true

    async function tick() {
      try {
        const j = await getCellGrid(packId, module, metric)
        if (alive) setGrid(j)
      } catch {
        if (alive) setGrid(null)
      }
    }

    tick()
    const id = setInterval(tick, 1500)
    return () => {
      alive = false
      clearInterval(id)
    }
  }, [packId, module, metric])

  return grid
}
