/**
 * AppShell: 좌측 사이드 네비 + 본문 Outlet.
 */
import { NavLink, Outlet } from "react-router-dom";

export default function AppShell() {
  return (
    <div className="shell">
      <aside className="side">
        <div className="brand">BMS Dashboard</div>
        <nav className="nav">
          <NavLink to="/" end className="nav-item">
            Dashboard
          </NavLink>
          <NavLink to="/alarms" className="nav-item">
            Alarms
          </NavLink>
          <NavLink to="/configuration" className="nav-item">
            Configuration
          </NavLink>
          <NavLink to="/analytics" className="nav-item">
            Analytics
          </NavLink>
          <NavLink to="/vfg" className="nav-item">
            Virtual Fuel Gauge
          </NavLink>
          <NavLink to="/history" className="nav-item">
            History
          </NavLink>
          <NavLink to="/system" className="nav-item">
            System
          </NavLink>
        </nav>
        <button
          className="bms-btn"
          type="button"
          onClick={() => {
            localStorage.removeItem("token");
            window.location.href = "/login";
          }}
        >
          Logout
        </button>
      </aside>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
