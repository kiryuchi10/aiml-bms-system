/**
 * Dashboard: M1 모듈 대시보드 — 상단 KPI, 좌측 컨트롤, 중앙 Cell grid, 우측 알람/온도센서.
 * WS data_update로 KPI 실시간 반영, REST refresh 보조.
 * API: GET /api/data/current, GET /api/data/cells, WS /ws/bms.
 */
import { useEffect, useState, useMemo } from "react";
import { EP } from "../services/endpoints";
import { apiGet, apiPost } from "../services/apiClient";
import { useBmsWebSocket } from "../hooks/useBmsWebSocket";
import { useAuth } from "../hooks/useAuth";
import TopKpiStrip from "../components/dashboard/TopKpiStrip";
import ModuleHeader from "../components/dashboard/ModuleHeader";
import CellGrid from "../components/dashboard/CellGrid";
import TempSensorRow from "../components/dashboard/TempSensorRow";

export default function Dashboard() {
  const { token } = useAuth();
  const { wsStatus, wsMsg } = useBmsWebSocket(token);
  const [snapshot, setSnapshot] = useState(null);
  const [cells, setCells] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!wsMsg || wsMsg.type !== "data_update") return;
    setSnapshot((prev) => ({
      ...(prev || {}),
      timestamp: wsMsg.timestamp,
      pack_voltage: wsMsg.pack_voltage ?? prev?.pack_voltage,
      pack_current: wsMsg.pack_current ?? prev?.pack_current,
      pack_soc: wsMsg.pack_soc ?? prev?.pack_soc,
      pack_temperature: wsMsg.pack_temperature ?? prev?.pack_temperature,
      active_alarms: wsMsg.active_alarms ?? prev?.active_alarms,
    }));
  }, [wsMsg]);

  async function refresh() {
    setLoading(true);
    setError("");
    try {
      const [s, c] = await Promise.all([
        apiGet(EP.current, token),
        apiGet(EP.cells, token),
      ]);
      setSnapshot(s);
      setCells(c.cells ?? []);
    } catch (e) {
      setError(e.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  async function connect() {
    setError("");
    try {
      await apiPost(EP.connect, token);
      await refresh();
    } catch (e) {
      setError(e.message || "Connect failed");
    }
  }

  async function startMonitoring() {
    setError("");
    try {
      await apiPost(EP.startMonitoring, token);
    } catch (e) {
      setError(e.message || "Start monitoring failed");
    }
  }

  useEffect(() => {
    if (token) refresh();
  }, [token]);

  const imbalance = useMemo(() => {
    if (!cells?.length) return 0;
    const vs = cells.map((x) => x.voltage).filter((v) => typeof v === "number");
    if (!vs.length) return 0;
    return Math.max(...vs) - Math.min(...vs);
  }, [cells]);

  const tempSensors = useMemo(() => {
    const ts = cells
      .map((x) => x.temperature)
      .filter((t) => typeof t === "number");
    ts.sort((a, b) => b - a);
    return ts.slice(0, 6);
  }, [cells]);

  const tempMin = useMemo(() => {
    const ts = cells
      .map((c) => c.temperature)
      .filter((t) => Number.isFinite(t));
    return ts.length ? Math.min(...ts) : null;
  }, [cells]);
  const tempMax = useMemo(() => {
    const ts = cells
      .map((c) => c.temperature)
      .filter((t) => Number.isFinite(t));
    return ts.length ? Math.max(...ts) : null;
  }, [cells]);

  const imbalancePct = imbalance ? (imbalance / 4.2) * 100 : 0;
  const alarmFault = (snapshot?.active_alarms ?? 0) > 0;

  return (
    <div className="bms-page">
      <TopKpiStrip
        moduleLabel="M1"
        wsStatus={wsStatus}
        loading={loading}
        packV={snapshot?.pack_voltage}
        soc={snapshot?.pack_soc}
        tempMin={tempMin}
        tempMax={tempMax}
        imbalancePct={imbalancePct}
        chargeMaxA={-35}
        currentA={snapshot?.pack_current ?? 0}
        dischargeMaxA={500}
        alarmFault={alarmFault}
      />

      {error ? (
        <div className="error-strip" role="alert">
          {error}
        </div>
      ) : null}

      <div className="bms-grid">
        <div className="bms-left">
          <ModuleHeader
            onConnect={connect}
            onStartMonitoring={startMonitoring}
            onRefresh={refresh}
          />
          <div className="bms-left-note">
            <div>API: {EP.current}</div>
            <div>WS: {wsStatus}</div>
          </div>
        </div>

        <div className="bms-center">
          <CellGrid cells={cells} socFallback={snapshot?.pack_soc} />
        </div>

        <div className="bms-right">
          <div className={`bms-alarm-box ${alarmFault ? "fault" : "ok"}`}>
            <div className="title">Alarm status</div>
            <div className="value">{alarmFault ? "Fault" : "Normal"}</div>
          </div>
          <div className="bms-panel">
            <div className="panel-title">Module Temperature Sensors</div>
            <TempSensorRow temps={tempSensors} />
          </div>
          <div className="bms-panel">
            <div className="panel-title">Notes</div>
            <div className="panel-body">
              셀 타일은 /api/data/cells 기반, 색상은 voltage/temperature 상태(OK/WARN/DANGER).
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
