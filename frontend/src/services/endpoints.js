/**
 * BMS API endpoint constants.
 * Base: http://localhost:8000 (변경 금지)
 */
export const API_BASE = "http://localhost:8000";
export const API_PREFIX = "/api";
export const WS_URL = "ws://localhost:8000/ws/bms";

export const EP = {
  status: `${API_PREFIX}/status`,
  connect: `${API_PREFIX}/connection/connect`,
  disconnect: `${API_PREFIX}/connection/disconnect`,
  startMonitoring: `${API_PREFIX}/monitoring/start`,
  stopMonitoring: `${API_PREFIX}/monitoring/stop`,

  current: `${API_PREFIX}/data/current`,
  cells: `${API_PREFIX}/data/cells`,
  cellById: (id) => `${API_PREFIX}/data/cells/${id}`,

  alarms: `${API_PREFIX}/alarms`,
  alarmById: (id) => `${API_PREFIX}/alarms/${id}`,
  ackAlarm: (id) => `${API_PREFIX}/alarms/${id}/acknowledge`,
  clearAlarm: (id) => `${API_PREFIX}/alarms/${id}/clear`,
  clearAll: `${API_PREFIX}/alarms/clear-all`,

  configuration: `${API_PREFIX}/configuration`,
  configReset: `${API_PREFIX}/configuration/reset`,

  socTrend: `${API_PREFIX}/analytics/soc-trend`,
  tempTrend: `${API_PREFIX}/analytics/temperature-trend`,
  stats: `${API_PREFIX}/analytics/statistics`,

  vfgStart: `${API_PREFIX}/virtual-fuel-gauge/start`,
  vfgStatus: (sid) => `${API_PREFIX}/virtual-fuel-gauge/${sid}/status`,
  vfgStop: (sid) => `${API_PREFIX}/virtual-fuel-gauge/${sid}/stop`,

  history: `${API_PREFIX}/data/history`,
  exportCsv: `${API_PREFIX}/data/export/csv`,

  sysReset: `${API_PREFIX}/system/reset`,
  calibrate: `${API_PREFIX}/system/calibrate`,
  logs: `${API_PREFIX}/system/logs`,
};
