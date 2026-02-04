/**
 * App: 라우팅 — /login, / (AuthGate + AppShell), Dashboard / Alarms / Configuration 등.
 * 토큰 없으면 AuthGate가 /login으로 리다이렉트.
 */
import { Routes, Route, Navigate } from "react-router-dom";
import AppShell from "./layouts/AppShell.jsx";
import AuthGate from "./layouts/AuthGate.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import AlarmScreen from "./pages/AlarmScreen.jsx";
import Configuration from "./pages/Configuration.jsx";
import Analytics from "./pages/Analytics.jsx";
import VirtualFuelGauge from "./pages/VirtualFuelGauge.jsx";
import History from "./pages/History.jsx";
import System from "./pages/System.jsx";
import Login from "./pages/Login.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/"
        element={
          <AuthGate>
            <AppShell />
          </AuthGate>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="alarms" element={<AlarmScreen />} />
        <Route path="configuration" element={<Configuration />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="vfg" element={<VirtualFuelGauge />} />
        <Route path="history" element={<History />} />
        <Route path="system" element={<System />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
