/**
 * useBmsStream: WebSocket /api/v1/ws/bms — pack/cells/alarms; Start/Stop control; optional toggleBalance.
 * Reconnect with exponential backoff (max 30s). Stale only when streaming and no message > 3s.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import type { AlarmState, CellState, PackState } from '../types/bms'
import { postBalanceSet } from '../services/api'

const WS_URL = import.meta.env.VITE_WS_URL ?? 'ws://localhost:8000/api/v1/ws/bms'
const DEFAULT_VEHICLE_ID = import.meta.env.VITE_VEHICLE_ID ?? 'MBM165-P50-B'

type ControlMsg = { type: 'control'; action: 'start' | 'stop' }

export function useBmsStream() {
  const [pack, setPack] = useState<PackState | null>(null)
  const [cells, setCells] = useState<CellState[]>([])
  const [alarms, setAlarms] = useState<AlarmState>({ active: [], latched: [] })
  const [connected, setConnected] = useState(false)
  const [stale, setStale] = useState(false)
  const [streaming, setStreaming] = useState(false)

  const wsRef = useRef<WebSocket | null>(null)
  const lastMsgAt = useRef<number>(Date.now())
  const retryRef = useRef(0)

  const sendControl = useCallback((action: 'start' | 'stop') => {
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) return
    const msg: ControlMsg = { type: 'control', action }
    ws.send(JSON.stringify(msg))
    setStreaming(action === 'start')
  }, [])

  const start = useCallback(() => sendControl('start'), [sendControl])
  const stop = useCallback(() => sendControl('stop'), [sendControl])

  const toggleBalance = useCallback(
    async (cellId: number): Promise<{ ok: boolean; cell_id: number; enabled: boolean; reason?: string; detail?: string }> => {
      const current = cells.find((c) => c.id === cellId)
      if (current == null) return { ok: false, cell_id: cellId, enabled: false, reason: 'NO_CELL', detail: 'No cell' }
      const nextEnabled = !Boolean(current.bal)
      setCells((prev) =>
        prev.map((c) => (c.id === cellId ? { ...c, bal: nextEnabled } : c))
      )
      try {
        const resp = await postBalanceSet({
          vehicle_id: DEFAULT_VEHICLE_ID,
          cell_id: cellId,
          enabled: nextEnabled,
        })
        if (!resp.ok) {
          setCells((prev) =>
            prev.map((c) => (c.id === cellId ? { ...c, bal: Boolean(current.bal) } : c))
          )
          throw new Error(resp.detail ?? resp.reason ?? 'Denied')
        }
        return resp
      } catch (e) {
        setCells((prev) =>
          prev.map((c) => (c.id === cellId ? { ...c, bal: Boolean(current.bal) } : c))
        )
        throw e
      }
    },
    [cells]
  )

  useEffect(() => {
    let staleTimer: ReturnType<typeof setInterval> | undefined

    const connect = () => {
      const ws = new WebSocket(WS_URL)
      wsRef.current = ws

      ws.onopen = () => {
        setConnected(true)
        retryRef.current = 0
        setStreaming(false)
      }

      ws.onmessage = (ev) => {
        lastMsgAt.current = Date.now()
        setStale(false)
        try {
          const msg = JSON.parse(ev.data as string)
          if (msg.scope === 'pack') setPack(msg)
          if (msg.scope === 'cells') setCells(msg.cells ?? [])
          if (msg.scope === 'alarms') setAlarms({ active: msg.active ?? [], latched: msg.latched ?? [] })
          if (msg.scope === 'state' && typeof msg.streaming === 'boolean') setStreaming(msg.streaming)
        } catch {
          // ignore non-JSON
        }
      }

      ws.onclose = () => {
        setConnected(false)
        setStreaming(false)
        wsRef.current = null
        const delay = Math.min(30000, 500 * 2 ** retryRef.current)
        retryRef.current += 1
        setTimeout(connect, delay)
      }

      ws.onerror = () => {
        try {
          ws.close()
        } catch {
          /* ignore */
        }
      }
    }

    connect()

    staleTimer = setInterval(() => {
      if (Date.now() - lastMsgAt.current > 3000 && streaming) setStale(true)
    }, 500)

    return () => {
      if (staleTimer) clearInterval(staleTimer)
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
    }
  }, [streaming])

  return { pack, cells, alarms, connected, stale, streaming, start, stop, toggleBalance }
}
