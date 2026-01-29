import { useEffect, useState } from 'react'
import { getHealth } from '../lib/api'

export function TopBar() {
  const [connected, setConnected] = useState<boolean | null>(null)

  useEffect(() => {
    let cancelled = false
    getHealth()
      .then(() => !cancelled && setConnected(true))
      .catch(() => !cancelled && setConnected(false))
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <header className="topBar">
      <div className="topLeft">
        <div className="statusBadge">
          <span className={`dot ${connected ? 'ok' : connected === false ? 'bad' : 'unknown'}`} />
          <span className="statusText">
            {connected === null ? 'Checking…' : connected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        <div className="appTitle">AIML-BMS Twin</div>
      </div>

      <div className="topActions">
        <button className="btn btnGreen">Start</button>
        <button className="btn btnRed">Record</button>
        <button className="btn">Generate Plot</button>
        <button className="btn">Virtual Fuel Gauge</button>
        <button className="btn">Open Config Wizard</button>
        <button className="btn btnGhost">OFF Expert Mode</button>
        <button className="btn btnBlue">Preferences</button>
      </div>
    </header>
  )
}

