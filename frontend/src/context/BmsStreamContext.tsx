/**
 * BmsStreamContext: connect/disconnect WS, TopBar Start/Stop, sliding window (maxPoints).
 * WS: ws://localhost:8000/ws/bms?dataset=B0005&hz=1 (or VITE_BMS_WS_URL).
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { WsBmsPayload } from '../services/apiV1'
import { getBmsWsUrlWithParams } from '../services/apiV1'

type BmsStreamContextValue = {
  connected: boolean
  error: string | null
  payload: WsBmsPayload | null
  /** Sliding window of pack points (t, v, i, temp, soc) for charts */
  window: { t: number; v: number; i: number; temp: number; soc: number }[]
  maxPoints: number
  setMaxPoints: (n: 60 | 120 | 240) => void
  connect: (dataset?: string, hz?: number) => void
  disconnect: () => void
  isStreaming: boolean
}

const BmsStreamContext = createContext<BmsStreamContextValue | null>(null)

export function useBmsStreamContext(): BmsStreamContextValue {
  const ctx = useContext(BmsStreamContext)
  if (!ctx) throw new Error('useBmsStreamContext must be used within BmsStreamProvider')
  return ctx
}

type BmsStreamProviderProps = {
  children: ReactNode
  defaultDataset?: string
  defaultHz?: number
}

export function BmsStreamProvider({
  children,
  defaultDataset = 'B0005',
  defaultHz = 1,
}: BmsStreamProviderProps) {
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [payload, setPayload] = useState<WsBmsPayload | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [maxPoints, setMaxPointsState] = useState<60 | 120 | 240>(120)
  const maxPointsRef = useRef(maxPoints)
  const [windowPoints, setWindowPoints] = useState<{ t: number; v: number; i: number; temp: number; soc: number }[]>([])
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    maxPointsRef.current = maxPoints
  }, [maxPoints])

  const setMaxPoints = useCallback((n: 60 | 120 | 240) => {
    setMaxPointsState(n)
  }, [])

  const disconnect = useCallback(() => {
    setIsStreaming(false)
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    setConnected(false)
    setError(null)
  }, [])

  const connect = useCallback((dataset?: string, hz?: number) => {
    disconnect()
    const key = dataset || defaultDataset
    const rate = hz ?? defaultHz
    setIsStreaming(true)
    setError(null)
    const url = getBmsWsUrlWithParams(key, rate)
    const ws = new WebSocket(url)
    wsRef.current = ws

    ws.onopen = () => {
      setConnected(true)
      setError(null)
    }
    ws.onclose = () => {
      setConnected(false)
      wsRef.current = null
    }
    ws.onerror = () => setError('WebSocket error')

    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data) as WsBmsPayload & { type?: string }
        if (msg.type === 'connection') return
        if (msg.type === 'telemetry' || msg.pack !== undefined) {
          setPayload(msg as WsBmsPayload)
          const p = msg.pack
          setWindowPoints((prev) => {
            const next = [
              ...prev,
              {
                t: Date.now(),
                v: p.voltage ?? 0,
                i: p.current ?? 0,
                temp: p.temp ?? 0,
                soc: (p.soc ?? 0) * (p.soc != null && p.soc <= 1 ? 100 : 1),
              },
            ]
            return next.slice(-maxPointsRef.current)
          })
        }
      } catch {
        // ignore
      }
    }
  }, [defaultDataset, defaultHz, disconnect, maxPoints])

  useEffect(() => {
    if (!isStreaming) return
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
    }
  }, [isStreaming])

  const value = useMemo<BmsStreamContextValue>(
    () => ({
      connected,
      error,
      payload,
      window: windowPoints,
      maxPoints,
      setMaxPoints,
      connect,
      disconnect,
      isStreaming,
    }),
    [connected, error, payload, windowPoints, maxPoints, setMaxPoints, connect, disconnect, isStreaming]
  )

  return (
    <BmsStreamContext.Provider value={value}>
      {children}
    </BmsStreamContext.Provider>
  )
}
