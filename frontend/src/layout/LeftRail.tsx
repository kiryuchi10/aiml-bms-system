import { NavLink } from 'react-router-dom'

export function LeftRail() {
  return (
    <aside className="leftRail">
      <NavLink to="/bms/home" className={({ isActive }) => `railBtn ${isActive ? 'active' : ''}`}>
        Dashboard Home
      </NavLink>
      <NavLink to="/bms/cells" className={({ isActive }) => `railBtn ${isActive ? 'active' : ''}`}>
        Cells Grid
      </NavLink>
      <NavLink to="/bms/realtime" className={({ isActive }) => `railBtn ${isActive ? 'active' : ''}`}>
        Realtime Monitor
      </NavLink>
      <NavLink to="/bms/analytics" className={({ isActive }) => `railBtn ${isActive ? 'active' : ''}`}>
        Analytics
      </NavLink>
      <NavLink to="/bms/doctor" className={({ isActive }) => `railBtn ${isActive ? 'active' : ''}`}>
        Battery Doctor
      </NavLink>
      <NavLink to="/bms/alarms" className={({ isActive }) => `railBtn ${isActive ? 'active' : ''}`}>
        Alarm Center
      </NavLink>
      <NavLink to="/bms/ml" className={({ isActive }) => `railBtn ${isActive ? 'active' : ''}`}>
        ML Console
      </NavLink>
      <NavLink to="/bms/monitoring" className={({ isActive }) => `railBtn ${isActive ? 'active' : ''}`}>
        Fuel Gauge
      </NavLink>
      <NavLink to="/bms/configuration" className={({ isActive }) => `railBtn ${isActive ? 'active' : ''}`}>
        BMS
      </NavLink>
      <NavLink to="/bms/dashboard" className={({ isActive }) => `railBtn ${isActive ? 'active' : ''}`}>
        Dashboard v1
      </NavLink>
      <div className="railHint">Help</div>
    </aside>
  )
}

