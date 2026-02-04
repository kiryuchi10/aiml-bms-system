/**
 * LeftSidebar — Fuel Gauge / BMS / Safety / Analytics nav; active state by path.
 */
import { useLocation, useNavigate } from 'react-router-dom'

export function LeftSidebar() {
  const nav = useNavigate()
  const loc = useLocation()

  const isBms = loc.pathname === '/dashboard'
  const isFuel = loc.pathname.includes('/fuel-gauge')
  const isSafety = loc.pathname.includes('/safety')
  const isAnalytics = loc.pathname.includes('/analytics')

  const activeStyle = { background: '#f0f0f0', color: '#333' }

  return (
    <div className="sidebar">
      <button
        type="button"
        className="sidebar-btn"
        onClick={() => nav('/dashboard/fuel-gauge')}
        style={isFuel ? activeStyle : undefined}
      >
        Fuel Gauge
      </button>
      <button
        type="button"
        className="sidebar-btn"
        onClick={() => nav('/dashboard')}
        style={isBms ? activeStyle : undefined}
      >
        BMS
      </button>
      <button
        type="button"
        className="sidebar-btn"
        onClick={() => nav('/dashboard/safety')}
        style={isSafety ? activeStyle : undefined}
      >
        Safety
      </button>
      <button
        type="button"
        className="sidebar-btn"
        onClick={() => nav('/dashboard/analytics')}
        style={isAnalytics ? activeStyle : undefined}
      >
        Analytics
      </button>
    </div>
  )
}
