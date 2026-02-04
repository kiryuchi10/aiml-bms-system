/**
 * RightPanel — wrapper for Learnings + Alarms (.right-panel).
 */
import type { ReactNode } from 'react'

export function RightPanel({ children }: { children?: ReactNode }) {
  return <div className="right-panel">{children}</div>
}
