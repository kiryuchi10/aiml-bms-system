import { useBmsStreamContext } from '../context/BmsStreamContext'

export function TopBar() {
  const { connected, isStreaming, connect, disconnect, error } = useBmsStreamContext()

  return (
    <header className="topBar">
      <div className="topLeft">
        <div className="statusBadge">
          <span className={`dot ${connected ? 'ok' : 'bad'}`} />
          <span className="statusText">
            {connected ? 'Connected' : 'Disconnected'}
            {error && ` (${error})`}
          </span>
        </div>
        <div className="appTitle">AIML-BMS Twin</div>
      </div>

      <div className="topActions">
        <button
          type="button"
          className="btn btnGreen"
          onClick={() => connect('B0005', 1)}
          disabled={isStreaming}
        >
          Start
        </button>
        <button
          type="button"
          className="btn btnRed"
          onClick={() => disconnect()}
          disabled={!isStreaming}
        >
          Stop
        </button>
        <button className="btn">Generate Plot</button>
        <button className="btn">Virtual Fuel Gauge</button>
        <button className="btn">Open Config Wizard</button>
        <button className="btn btnGhost">OFF Expert Mode</button>
        <button className="btn btnBlue">Preferences</button>
      </div>
    </header>
  )
}

