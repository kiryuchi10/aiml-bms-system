import { ReactNode } from 'react'
import { LeftRail } from './LeftRail'
import { TopBar } from './TopBar'
import { TabsBar } from './TabsBar'

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="appRoot">
      <TopBar />
      <div className="mainRow">
        <LeftRail />
        <div className="contentCol">
          <TabsBar />
          <div className="pageBody">{children}</div>
        </div>
      </div>
    </div>
  )
}

