/**
 * useToast — push toast messages (success / error / info); auto-dismiss after 2.2s.
 */
import { useCallback, useState } from 'react'

export type ToastItem = { id: string; message: string; kind: 'success' | 'error' | 'info' }

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const push = useCallback((message: string, kind: ToastItem['kind'] = 'info') => {
    const id = String(Date.now()) + Math.random().toString(16).slice(2)
    setToasts((prev) => [...prev, { id, message, kind }])
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 2200)
  }, [])

  return { toasts, push }
}
