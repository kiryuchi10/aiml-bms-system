/**
 * ShellLayout — 1:1 with HTML: HeaderBar, ControlBar, MainContent (LeftSidebar + center-panel + RightPanel), FooterBar.
 */
import type { ReactNode } from 'react'
import { HeaderBar } from './HeaderBar'
import { ControlBar } from './ControlBar'
import { LeftSidebar } from './LeftSidebar'
import { RightPanel } from './RightPanel'
import { FooterBar } from './FooterBar'

export function ShellLayout({
  title,
  timestamp,
  connected,
  stale,
  streaming,
  onStart,
  onStop,
  onPlot,
  children,
  right,
}: {
  title: string
  timestamp: string
  connected: boolean
  stale: boolean
  streaming: boolean
  onStart: () => void
  onStop: () => void
  onPlot: () => void
  children: ReactNode
  right?: ReactNode
}) {
  return (
    <div className="bms-container">
      <HeaderBar title={title} timestamp={timestamp} />
      <ControlBar
        connected={connected}
        stale={stale}
        streaming={streaming}
        onStart={onStart}
        onStop={onStop}
        onPlot={onPlot}
      />
      <div className="main-content">
        <LeftSidebar />
        <div className="center-panel">{children}</div>
        <RightPanel>{right}</RightPanel>
      </div>
      <FooterBar />
    </div>
  )
}
