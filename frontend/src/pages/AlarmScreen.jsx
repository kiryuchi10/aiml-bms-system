/**
 * AlarmScreen: 알람 목록 + 상세 + ACK / CLEAR / CLEAR-ALL.
 */
import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useAlarms } from "../hooks/useAlarms";
import { alarmApi } from "../services/alarmApi";

export default function AlarmScreen() {
  const { token } = useAuth();
  const [activeOnly, setActiveOnly] = useState(true);
  const [severity, setSeverity] = useState("");
  const [selected, setSelected] = useState(null);
  const { data, loading, err, refresh } = useAlarms(token, {
    activeOnly,
    severity,
    limit: 100,
  });

  async function openDetail(a) {
    setSelected(null);
    try {
      const detail = await alarmApi.detail(token, a.alarm_id);
      setSelected(detail);
    } catch {
      setSelected(a);
    }
  }

  async function ack(id) {
    await alarmApi.acknowledge(token, id);
    await refresh();
    if (selected?.alarm_id === id) openDetail({ alarm_id: id });
  }

  async function clear(id) {
    await alarmApi.clear(token, id);
    await refresh();
    if (selected?.alarm_id === id) setSelected(null);
  }

  async function clearAll() {
    await alarmApi.clearAll(token);
    await refresh();
    setSelected(null);
  }

  return (
    <div className="page-wrap">
      <div className="page-title">Alarm Screen</div>

      <div className="bms-panel">
        <div className="row">
          <label className="chk">
            <input
              type="checkbox"
              checked={activeOnly}
              onChange={(e) => setActiveOnly(e.target.checked)}
            />
            Active only
          </label>
          <select
            value={severity}
            onChange={(e) => setSeverity(e.target.value)}
            className="select"
          >
            <option value="">All severity</option>
            <option value="critical">critical</option>
            <option value="warning">warning</option>
            <option value="info">info</option>
          </select>
          <button className="bms-btn" type="button" onClick={refresh}>
            Refresh
          </button>
          <button className="bms-btn danger" type="button" onClick={clearAll}>
            Clear All
          </button>
          <div className="muted" style={{ marginLeft: "auto" }}>
            total: {data.total ?? 0} / active: {data.active ?? 0}
          </div>
        </div>
        {err ? <div className="error">Error: {err}</div> : null}
        {loading ? <div className="muted">Loading...</div> : null}
      </div>

      <div className="split">
        <div className="bms-panel">
          <div className="panel-title">Alarms</div>
          <div className="alarm-list">
            {(data.alarms || []).map((a) => (
              <button
                key={a.alarm_id}
                type="button"
                className={`alarm-item ${a.is_active ? "active" : ""}`}
                onClick={() => openDetail(a)}
              >
                <div className="alarm-top">
                  <div className="alarm-type">{a.alarm_type}</div>
                  <div className={`sev ${a.severity}`}>{a.severity}</div>
                </div>
                <div className="alarm-msg">{a.message}</div>
                <div className="alarm-meta">{a.timestamp}</div>
              </button>
            ))}
          </div>
        </div>
        <div className="bms-panel">
          <div className="panel-title">Detail</div>
          {!selected ? (
            <div className="muted">Select an alarm</div>
          ) : (
            <>
              <div className="detail-line">
                <span className="muted">ID</span> {selected.alarm_id}
              </div>
              <div className="detail-line">
                <span className="muted">Type</span> {selected.alarm_type}
              </div>
              <div className="detail-line">
                <span className="muted">Severity</span> {selected.severity}
              </div>
              <div className="detail-line">
                <span className="muted">Active</span>{" "}
                {String(selected.is_active)}
              </div>
              <div className="detail-line">
                <span className="muted">Latched</span>{" "}
                {String(selected.is_latched)}
              </div>
              <div className="detail-line">
                <span className="muted">Time</span> {selected.timestamp}
              </div>
              <div className="detail-line">
                <span className="muted">Message</span> {selected.message}
              </div>
              <div className="row" style={{ marginTop: 10 }}>
                <button
                  className="bms-btn"
                  type="button"
                  onClick={() => ack(selected.alarm_id)}
                >
                  Acknowledge
                </button>
                <button
                  className="bms-btn danger"
                  type="button"
                  onClick={() => clear(selected.alarm_id)}
                >
                  Clear
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
