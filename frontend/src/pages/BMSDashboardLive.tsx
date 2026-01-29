import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { bmsSimulator, type BMSState } from '../services/bmsSimulator'
import { VirtualFuelGauge } from '../components/VirtualFuelGauge'
import '../styles/BMSDashboard.css'

function formatTime(d: Date): string {
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}

export function BMSDashboardLive() {
  const navigate = useNavigate()
  const [state, setState] = useState<BMSState>(bmsSimulator.getState())
  const [showVfg, setShowVfg] = useState(false)
  const [clock, setClock] = useState(new Date())

  useEffect(() => {
    const unsub = bmsSimulator.subscribe(setState)
    return unsub
  }, [])

  useEffect(() => {
    const id = setInterval(() => setClock(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const handleStart = () => bmsSimulator.start(1000)
  const handleStop = () => bmsSimulator.stop()
  const handleToggleMode = () => bmsSimulator.toggleMode()
  const handleResetFuelGauge = () => bmsSimulator.resetFuelGauge()
  const handleExportCSV = () => {
    const csv = bmsSimulator.exportCSV()
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bms_export_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="bms-dashboard">
      <header className="bms-header">
        <div className="bms-header-title">⚡ MBM165-P50-B GUI - Battery Management System</div>
        <div className="header-time">{formatTime(clock)}</div>
      </header>

      <div className="bms-control-bar">
        <button
          type="button"
          className={`control-btn ${state.connected ? 'connected' : ''}`}
        >
          ● {state.connected ? 'Connected' : 'Disconnected'}
        </button>
        <button type="button" className="control-btn start" onClick={handleStart}>
          ▶ Start
        </button>
        <button type="button" className="control-btn" onClick={handleStop}>
          ⬛ Stop
        </button>
        <button type="button" className="control-btn" onClick={handleExportCSV}>
          📊 Generate Plot / Export CSV
        </button>
        <button type="button" className="control-btn" onClick={() => setShowVfg(true)}>
          ⛽ Virtual Fuel Gauge
        </button>
        <button type="button" className="control-btn" onClick={() => navigate('/bms/configuration')}>
          ⚙ Configuration
        </button>
        <button type="button" className="control-btn" onClick={() => navigate('/bms/monitoring')}>
          ⚙️ Back to App
        </button>
      </div>

      <div className="bms-main">
        <aside className="bms-sidebar">
          <button type="button" className="sidebar-btn">
            Fuel Gauge
          </button>
          <button type="button" className="sidebar-btn inactive">
            BMS
          </button>
        </aside>

        <div className="bms-center">
          <div className="panel-header">Pack Real Time Status</div>

          <div className="pack-overview">
            <div className="metric-card">
              <div className="metric-label">Pack Voltage</div>
              <div className="metric-value">{state.packVoltage.toFixed(3)} V</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Pack Current</div>
              <div className="metric-value">{state.packCurrent.toFixed(3)} A</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Pack Status</div>
              <div className="metric-value status">{state.packStatus}</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Ambient Temp</div>
              <div className="metric-value">{state.ambientTemp.toFixed(2)} °C</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Pack Temp</div>
              <div className="metric-value">{state.packTemp.toFixed(2)} °C</div>
            </div>
          </div>

          <div className="soc-section">
            <div className="soc-gauge">
              <div className="soc-label">Unusable Pack SoC: {state.unusableSoc}%</div>
              <div className="soc-circle">
                <div className="soc-percentage">{state.packSoc.toFixed(2)}%</div>
              </div>
              <div className="soc-label">Usable Pack SoC</div>
            </div>
            <div className="pack-info">
              <div className="info-card">
                <span className="info-label">Pack SoH</span>
                <span className="info-value green">{state.packSoh}%</span>
              </div>
              <div className="info-card">
                <span className="info-label">Remaining Time</span>
                <span className="info-value">{state.remainingToEmpty}</span>
              </div>
              <div className="info-card">
                <span className="info-label">CC Charge</span>
                <span className="info-value">{state.ccCharge}</span>
              </div>
              <div className="info-card">
                <span className="info-label">To Full</span>
                <span className="info-value">{state.remainingToFull}</span>
              </div>
            </div>
          </div>

          <table className="cell-table">
            <thead>
              <tr>
                <th>Cell</th>
                <th>Voltage</th>
                <th>Temp</th>
                <th>Current</th>
                <th>Abs SoC</th>
                <th>SoH</th>
                <th>Del. Est</th>
                <th>Chg. Est</th>
              </tr>
            </thead>
            <tbody>
              {state.cells.map((c) => (
                <tr key={c.id} className={!c.active ? 'cell-inactive' : ''}>
                  <td>{String(c.id).padStart(2, '0')}</td>
                  <td className={c.active ? 'cell-active' : ''}>
                    {c.active ? `${c.voltage.toFixed(4)} V` : '—'}
                  </td>
                  <td className={c.active ? 'cell-active' : ''}>
                    {c.active ? `${c.temp.toFixed(2)} °C` : '—'}
                  </td>
                  <td className={c.active ? 'cell-active' : ''}>
                    {c.active ? `${c.current.toFixed(3)} A` : '—'}
                  </td>
                  <td>{c.active ? `${c.absSoc} %` : '0 %'}</td>
                  <td>{c.soh} %</td>
                  <td className={c.active ? 'cell-active' : ''}>{c.disEsr} %</td>
                  <td className={c.active ? 'cell-active' : ''}>{c.chgEsr} %</td>
                </tr>
              ))}
            </tbody>
          </table>

          <button type="button" className="control-btn start reset-btn" onClick={handleResetFuelGauge}>
            Reset Fuel Gauge
          </button>
        </div>

        <div className="bms-right">
          <div className="learnings-section">
            <div className="panel-header" style={{ fontSize: 12, marginBottom: 12 }}>
              Learnings
            </div>
            <div className="learning-item">
              <span className="learning-label">CC Charger Current</span>
              <span className="learning-value">{state.learnings.ccChargerCurrent} A</span>
            </div>
            <div className="learning-item">
              <span className="learning-label">Avg. Load Current</span>
              <span className="learning-value">{state.learnings.avgLoadCurrent} A</span>
            </div>
            <div className="learning-item">
              <span className="learning-label">Charger End Current</span>
              <span className="learning-value">{state.learnings.chargerEndCurrent} A</span>
            </div>
            <div className="learning-item">
              <span className="learning-label">Load End Current</span>
              <span className="learning-value">{state.learnings.loadEndCurrent} A</span>
            </div>
            <div className="learning-item">
              <span className="learning-label">CV Charger Voltage</span>
              <span className="learning-value">{state.learnings.cvChargerVoltage} V</span>
            </div>
            <div className="learning-item">
              <span className="learning-label">Heat Transfer Coeff</span>
              <span className="learning-value">{state.learnings.heatTransferCoeff} W/(m²·K)</span>
            </div>
          </div>

          <div className="alarms-section">
            <div className="alarm-header">
              <div className="panel-header" style={{ fontSize: 12, margin: 0 }}>
                Alarms
              </div>
              <div className="alarm-indicators">
                <span>
                  <span className="alarm-dot active" /> Active
                </span>
                <span>
                  <span className="alarm-dot latched" /> Latched
                </span>
              </div>
            </div>
            <div className="alarms-grid">
              {state.alarms.map((a) => (
                <div
                  key={a.id}
                  className={`alarm-item ${a.active ? 'active-alarm' : ''}`}
                >
                  {a.active ? '⚠ ' : ''}{a.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <footer className="bms-footer">
        <button type="button" className="help-btn">
          Help
        </button>
      </footer>

      {showVfg && <VirtualFuelGauge onClose={() => setShowVfg(false)} />}
    </div>
  )
}
