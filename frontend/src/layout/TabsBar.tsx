import { NavLink } from 'react-router-dom'

const tabs = [
  { to: '/bms/monitoring', label: 'Monitoring' },
  { to: '/bms/live', label: 'Live BMS' },
  { to: '/bms/configuration', label: 'Configuration' },
  { to: '/bms/lifetime', label: 'Lifetime Log' },
  { to: '/bms/learnings', label: 'Learnings Backup' },
  { to: '/bms/training', label: 'Training Results' },
]

export function TabsBar() {
  return (
    <div className="tabsBar">
      {tabs.map((t) => (
        <NavLink key={t.to} to={t.to} className={({ isActive }) => `tab ${isActive ? 'active' : ''}`}>
          {t.label}
        </NavLink>
      ))}
    </div>
  )
}

