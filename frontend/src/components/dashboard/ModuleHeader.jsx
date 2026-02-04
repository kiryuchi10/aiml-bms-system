/**
 * ModuleHeader: 좌측 컨트롤 — Back, Alarm Screen, Connect, Start Monitoring, Refresh.
 */
import { useNavigate } from "react-router-dom";

export default function ModuleHeader({ onConnect, onStartMonitoring, onRefresh }) {
  const nav = useNavigate();
  return (
    <div className="bms-panel">
      <div className="panel-title">Controls</div>
      <div className="btn-col">
        <button className="bms-btn" type="button" onClick={() => nav(-1)}>
          Back
        </button>
        <button className="bms-btn" type="button" onClick={() => nav("/alarms")}>
          Alarm Screen
        </button>
      </div>
      <div className="divider" />
      <div className="btn-col">
        <button className="bms-btn primary" type="button" onClick={onConnect}>
          Connect
        </button>
        <button className="bms-btn" type="button" onClick={onStartMonitoring}>
          Start Monitoring
        </button>
        <button className="bms-btn" type="button" onClick={onRefresh}>
          Refresh
        </button>
      </div>
      <div className="hint">Connect → Start Monitoring → WS/REST로 실시간 갱신</div>
    </div>
  );
}
