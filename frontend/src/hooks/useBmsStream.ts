/**
 * WebSocket hook for /api/v1/ws/bms.
 * Consumes real BMS payload (timestamp, pack, cells, balancing, alarms).
 */

import { useEffect, useRef, useState } from 'react'
import type { WsBmsPayload } from '../services/apiV1'
import { getBmsWsUrl } from '../services/apiV1'

export function useBmsStream(datasetKey: string | null) {
  const [payload, setPayload] = useState<WsBmsPayload | null>(null)
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    const url = getBmsWsUrl(datasetKey || undefined)
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
        const msg = JSON.parse(ev.data) as WsBmsPayload & { type?: string }
        if (msg.type === 'telemetry' || msg.pack !== undefined) {
          setPayload(msg as WsBmsPayload)
        }
      } catch {
        // ignore non-JSON
      }
    }

    return () => {
      ws.close()
      wsRef.current = null
    }
  }, [datasetKey])

  return { payload, connected, error }
}
