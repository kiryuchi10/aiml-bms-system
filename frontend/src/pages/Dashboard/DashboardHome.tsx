/**
 * DashboardHome: "Battery pack information" — REST initial load + WebSocket live updates.
 * BMS contract: pack/cells/alarms; connected/stale in status.
 */
import { useEffect, useState } from 'react'
import { getVehicleDashboard } from '../../services/dashboardApi'
import { useBmsStream } from '../../hooks/useBmsStream'
import { BatteryPackPanel } from '../../components/bms/BatteryPackPanel'
import { CanLinkStatus } from '../../components/bms/CanLinkStatus'
import { SignalTile } from '../../components/bms/SignalTile'

const DEFAULT_VEHICLE_ID = import.meta.env.VITE_VEHICLE_ID ?? 'MBM165-P50-B'

export function DashboardHome() {
  const vehicleId = DEFAULT_VEHICLE_ID
  const [initial, setInitial] = useState<Awaited<ReturnType<typeof getVehicleDashboard>> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { pack: wsPack, cells: wsCells, alarms: wsAlarms, connected, stale } = useBmsStream()

  useEffect(() => {
    getVehicleDashboard(vehicleId)
      .then(setInitial)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false))
  }, [vehicleId])

  const pack = wsPack ?? initial?.pack ?? null
  const cells = wsCells.length ? wsCells : (initial?.cells ?? [])
  const alarms = (wsAlarms.active.length || wsAlarms.latched.length) ? wsAlarms : (initial?.alarms ?? { active: [], latched: [] })

  const cellsForPanel = cells.map((c) => ({
    cell_id: String(c.id),
    voltage: c.v ?? null,
    temperature: c.t ?? null,
    soc: c.soc ?? null,
  }))

  const packVoltage = pack?.voltage ?? pack?.pack_voltage ?? 0
  const packCurrent = pack?.current ?? pack?.pack_current ?? 0
  const packTemp = pack?.pack_temp ?? pack?.pack_temp ?? 0

  if (loading && !initial) return <div className="dashboard-loading">Loading...</div>
  if (error && !initial) return <div className="dashboard-error">{error}</div>

  return (
    <div className="dashboard-home">
      <div className="dashboard-home-left">
        <CanLinkStatus connected={connected} />
        {stale && <span className="data-stale" title="No update &gt; 3s">Stale</span>}
      </div>
      <div className="dashboard-home-center">
        <h2>Battery pack information</h2>
        <BatteryPackPanel cells={cellsForPanel} />
        {alarms.active.length > 0 && (
          <div className="alarms-active">
            <strong>Active:</strong> {alarms.active.join(', ')}
          </div>
        )}
        {alarms.latched.length > 0 && (
          <div className="alarms-latched">
            <strong>Latched:</strong> {alarms.latched.join(', ')}
          </div>
        )}
      </div>
      <div className="dashboard-home-right">
        <SignalTile label="Current" value={packCurrent} unit="A" />
        <SignalTile label="Voltage" value={packVoltage} unit="V" />
        <SignalTile label="Temperature" value={packTemp} unit="°C" />
      </div>
    </div>
  )
}
