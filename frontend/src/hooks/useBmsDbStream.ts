/**
 * WebSocket hook for /ws/bms/db (DB replay).
 * Streams telemetry_cell rows; consumer can aggregate into pack/cells for sliding chart.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { getBmsWsDbUrl } from '../services/apiV1'

export type DbTelemetryRow = {
  id: number
  vehicle_id: number
  cell_id: number
  ts: string | null
  voltage: number | null
  current: number | null
  temperature: number | null
  soc: number | null
  balancing: boolean
  type?: string
}

export function useBmsDbStream(vehicleId = 1, intervalMs = 500, enabled: boolean) {
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastRow, setLastRow] = useState<DbTelemetryRow | null>(null)
  const [packSnapshot, setPackSnapshot] = useState<{ ts: number; v: number; i: number; soc: number; temp: number }[]>([])
  const wsRef = useRef<WebSocket | null>(null)
  const cellsMapRef = useRef<Map<number, DbTelemetryRow>>(new Map())
  const maxPoints = 120

  const clear = useCallback(() => {
    setPackSnapshot([])
    cellsMapRef.current.clear()
  }, [])

  useEffect(() => {
    if (!enabled) {
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
      setConnected(false)
      return
    }
    const url = getBmsWsDbUrl(vehicleId, intervalMs)
    const ws = new WebSocket(url)
    wsRef.current = ws

    ws.onopen = () => {
      setConnected(true)
      setError(null)
    }
    ws.onclose = () => setConnected(false)
    ws.onerror = () => setError('WebSocket error')

    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data) as DbTelemetryRow & { type?: string }
        if (msg.type === 'connection') return
        if (msg.cell_id != null && msg.id != null) {
          setLastRow(msg)
          cellsMapRef.current.set(msg.cell_id, msg)
          const cells = Array.from(cellsMapRef.current.values())
          const ts = msg.ts ? new Date(msg.ts).getTime() : Date.now()
          const v = cells.reduce((s, c) => s + (c.voltage ?? 0), 0)
          const i = cells.length ? (cells[0].current ?? 0) : 0
          const soc = cells.length ? cells.reduce((s, c) => s + (c.soc ?? 0), 0) / cells.length : 0
          const temp = cells.length ? cells.reduce((s, c) => s + (c.temperature ?? 0), 0) / cells.length : 0
          setPackSnapshot((prev) => {
            const next = [...prev, { ts, v, i, soc, temp }]
            return next.slice(-maxPoints)
          })
        }
      } catch {
        // ignore
      }
    }

    return () => {
      ws.close()
      wsRef.current = null
    }
  }, [enabled, vehicleId, intervalMs])

  return { connected, error, lastRow, packSnapshot, clear }
}
