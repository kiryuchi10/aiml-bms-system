import { Link } from 'react-router-dom'

export function MonitoringPage() {
  return (
    <div className="grid2">
      <div style={{ marginBottom: 10 }}>
        <Link to="/bms/live" className="btn btnGreen" style={{ textDecoration: 'none' }}>
          Open Live BMS Dashboard (real-time simulation)
        </Link>
      </div>
      <section className="panel">
        <div className="panelTitle">Pack Real Time Status</div>
        <div className="kpiRow">
          <div className="kpi">
            <div className="kpiLabel">Pack Voltage</div>
            <div className="kpiValue">30.232 V</div>
          </div>
          <div className="kpi">
            <div className="kpiLabel">Pack Current</div>
            <div className="kpiValue">-0.057 A</div>
          </div>
          <div className="kpi">
            <div className="kpiLabel">Pack Status</div>
            <div className="kpiValue">Discharge</div>
          </div>
          <div className="kpi">
            <div className="kpiLabel">Ambient Temp.</div>
            <div className="kpiValue">25.16 °C</div>
          </div>
          <div className="kpi">
            <div className="kpiLabel">Pack Temp.</div>
            <div className="kpiValue">25.16 °C</div>
          </div>
        </div>

        <div className="monitorGrid">
          <div className="socCol">
            <div className="socCard">
              <div className="socPct">0%</div>
              <div className="socLabel">Pack SoC</div>
            </div>
            <div className="socCard">
              <div className="socPct">8.24%</div>
              <div className="socLabel">Unusable Pack SoC</div>
            </div>
            <div className="socCard">
              <div className="socPct">100%</div>
              <div className="socLabel">Pack SoH</div>
            </div>
            <div className="socCard">
              <div className="socLabel">Remaining Time</div>
              <div className="socMini">To Empty: 0h 1m</div>
              <div className="socMini">To Full: 1h 56m</div>
            </div>
            <button className="btnWide">Reset Fuel Gauge</button>
          </div>

          <div className="cellTable">
            <div className="tableHeader">Cells</div>
            <div className="tableNote">Placeholder: connect to live/dataset telemetry later.</div>
            <div className="tableGrid">
              {Array.from({ length: 10 }).map((_, i) => (
                <div className="row" key={i}>
                  <div className="cell">{String(i + 1).padStart(2, '0')}</div>
                  <div className="cell mono">3.03 V</div>
                  <div className="cell mono">-0.06 A</div>
                  <div className="cell mono">25.1 °C</div>
                  <div className="cell mono">100%</div>
                </div>
              ))}
            </div>
            <div className="tableFooter">
              <span>Voltage</span>
              <span>Temperature</span>
              <span>Current</span>
              <span>Absolute SoC</span>
            </div>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panelTitle">Learnings</div>

        <div className="panelBlock">
          <div className="blockTitle">Power</div>
          <div className="kv">
            <div className="kvRow">
              <span>Measured</span>
              <span className="mono">1.6 W</span>
            </div>
            <div className="kvRow">
              <span>Max. Discharge</span>
              <span className="mono">118.7 W</span>
            </div>
            <div className="kvRow">
              <span>Max. Charge</span>
              <span className="mono">125.8 W</span>
            </div>
          </div>
        </div>

        <div className="panelBlock">
          <div className="blockTitle">OT Warnings</div>
          <div className="kv">
            <div className="kvRow">
              <span>Charge CC OT</span>
              <span className="mono">—</span>
            </div>
            <div className="kvRow">
              <span>Charge End OT</span>
              <span className="mono">—</span>
            </div>
            <div className="kvRow">
              <span>Discharge OT</span>
              <span className="mono">—</span>
            </div>
          </div>
        </div>

        <div className="panelBlock">
          <div className="blockTitle">Limiting Factor</div>
          <div className="kv">
            <div className="kvRow">
              <span>Empty</span>
              <span className="mono">Pack 5</span>
            </div>
            <div className="kvRow">
              <span>Full</span>
              <span className="mono">Charger 4</span>
            </div>
            <div className="kvRow">
              <span>Discharge Power</span>
              <span className="mono">Pack 5</span>
            </div>
            <div className="kvRow">
              <span>Charge Power</span>
              <span className="mono">Pack 10</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

