/**
 * SideBar: nav links for Dashboard, Fleet, Trips, Research.
 */
import { NavLink } from 'react-router-dom'

export function SideBar() {
  return (
    <aside className="side-bar">
      <nav className="side-nav">
        <NavLink to="/dashboard" end className="side-link">Dashboard</NavLink>
        <NavLink to="/dashboard/fleet" className="side-link">Fleet</NavLink>
        <NavLink to="/dashboard/trips" className="side-link">Trips</NavLink>
        <NavLink to="/dashboard/research" className="side-link">Research</NavLink>
      </nav>
    </aside>
  )
}
