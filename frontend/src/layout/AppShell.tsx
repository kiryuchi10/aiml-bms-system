import { ReactNode } from 'react'
import { BmsStreamProvider } from '../context/BmsStreamContext'
import { LeftRail } from './LeftRail'
import { TopBar } from './TopBar'
import { TabsBar } from './TabsBar'

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <BmsStreamProvider defaultDataset="B0005" defaultHz={1}>
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
    </BmsStreamProvider>
  )
}

