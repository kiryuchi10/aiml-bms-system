# Z Column Mapping — NASA .mat ↔ DB ↔ UI

Standard keys for UI, API, and DB so all layers use the same names.

## NASA B0005 (and similar) .mat → DB

| NASA .mat field | Meaning | DB table.column (recommended) |
|-----------------|---------|--------------------------------|
| cycle[i].type | charge / discharge / impedance | telemetry_cell.source or trip_type tag |
| cycle[i].ambient_temperature | Ambient (single value) | telemetry_pack.pack_temp (option) or trip.ambient_temp |
| data.Time | Time (seconds) | telemetry_cell.ts (base timestamp + seconds) |
| data.Voltage_measured | Cell voltage | telemetry_cell.voltage |
| data.Current_measured | Cell current | telemetry_cell.current |
| data.Temperature_measured | Cell temperature | telemetry_cell.temperature |
| data.Current_charge | Charge current (when present) | telemetry_cell.current or optional current_charge column |
| data.Voltage_charge | Charge voltage (when present) | telemetry_cell.voltage or optional voltage_charge column |

## UI / API standard keys (Z)

Use these in frontend and API responses for consistency:

| Z key | Description | Unit | Source |
|-------|-------------|------|--------|
| pack_voltage | Pack voltage | V | telemetry_pack.pack_voltage |
| pack_current | Pack current | A | telemetry_pack.pack_current |
| pack_temp | Pack / ambient temp | °C | telemetry_pack.pack_temp |
| soc | State of charge | % or 0–1 | telemetry_pack.soc or derived |
| soh | State of health | % or 0–1 | telemetry_pack.soh or metric_aging.soh_proxy |
| voltage | Cell voltage | V | telemetry_cell.voltage |
| current | Cell current | A | telemetry_cell.current |
| temperature | Cell temperature | °C | telemetry_cell.temperature |
| balancing | Cell balancing on/off | boolean | telemetry_cell.balancing |

## Pack / Cell summary (Dashboard)

- **Pack:** pack_voltage, pack_current, pack_temp, soc, soh, status (derived from rules).
- **Cell:** cell_id, voltage, temperature, current, soc, soh, balancing; status (OK/WARN/DANGER) from voltage/temp thresholds.

## Notes

- For single-cell NASA data, map to vehicle_id=1, module_id=1, cell_id=1 (or expand to N cells with noise for UI).
- All timestamps: UTC recommended; store with timezone in DB (TIMESTAMPTZ / DATETIME(6)).
