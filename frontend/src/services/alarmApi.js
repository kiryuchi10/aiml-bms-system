/**
 * Alarm API: list (GET /api/alarms), acknowledge, clear, clear-all.
 */
import { EP } from "./endpoints";
import { apiGet, apiPost } from "./apiClient";

export const alarmApi = {
  list: (token, params = {}) => {
    const q = new URLSearchParams();
    if (params.active_only !== undefined) q.set("active_only", String(params.active_only));
    if (params.severity) q.set("severity", params.severity);
    if (params.limit != null) q.set("limit", String(params.limit));
    const suffix = q.toString() ? `?${q.toString()}` : "";
    return apiGet(`${EP.alarms}${suffix}`, token);
  },
  acknowledge: (token, alarmId) => apiPost(EP.ackAlarm(alarmId), token),
  clear: (token, alarmId) => apiPost(EP.clearAlarm(alarmId), token),
  clearAll: (token) => apiPost(EP.clearAll, token),
  detail: (token, alarmId) => apiGet(EP.alarmById(alarmId), token),
};
