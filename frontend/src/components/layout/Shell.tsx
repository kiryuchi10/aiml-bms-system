/**
 * Shell: layout with TopBar + SideBar + Outlet for dashboard pages.
 */
import { Outlet } from 'react-router-dom'
import { TopBar } from './TopBar'
import { SideBar } from './SideBar'

export function Shell() {
  return (
    <div className="shell">
      <TopBar />
      <div className="shell-body">
        <SideBar />
        <main className="shell-main">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
