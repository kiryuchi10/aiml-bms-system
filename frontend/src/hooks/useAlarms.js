/**
 * useAlarms: fetches alarm list (GET /api/alarms) with active_only, severity, limit.
 */
import { useEffect, useState } from "react";
import { alarmApi } from "../services/alarmApi";

export function useAlarms(token, options = {}) {
  const { activeOnly = false, severity = "", limit = 50, pollInterval = 3000 } = options;
  const [data, setData] = useState({ total: 0, active: 0, alarms: [] });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function refresh() {
    setLoading(true);
    setErr("");
    try {
      const res = await alarmApi.list(token, {
        active_only: activeOnly,
        severity: severity || undefined,
        limit,
      });
      setData(res);
    } catch (e) {
      setErr(e.message || "Failed to load alarms");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!token) return;
    refresh();
    const id = setInterval(refresh, pollInterval);
    return () => clearInterval(id);
  }, [token, activeOnly, severity, limit]);

  return { data, loading, err, refresh };
}
