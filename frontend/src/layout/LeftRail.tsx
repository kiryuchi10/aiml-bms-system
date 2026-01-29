import { NavLink } from 'react-router-dom'

export function LeftRail() {
  return (
    <aside className="leftRail">
      <NavLink to="/bms/monitoring" className={({ isActive }) => `railBtn ${isActive ? 'active' : ''}`}>
        Fuel Gauge
      </NavLink>
      <NavLink to="/bms/configuration" className={({ isActive }) => `railBtn ${isActive ? 'active' : ''}`}>
        BMS
      </NavLink>
      <div className="railHint">Help</div>
    </aside>
  )
}

