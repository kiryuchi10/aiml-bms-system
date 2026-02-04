/**
 * ControlBar — Connected/Disconnected, Streaming, Stale; Start, Stop, Generate Plot, Config, Preferences.
 */
export function ControlBar({
  connected,
  stale,
  streaming,
  onStart,
  onStop,
  onPlot,
}: {
  connected: boolean
  stale: boolean
  streaming: boolean
  onStart: () => void
  onStop: () => void
  onPlot: () => void
}) {
  return (
    <div className="control-bar">
      <button className={`btn ${connected ? 'btn-connected' : ''}`} type="button">
        ● {connected ? 'Connected' : 'Disconnected'}
        {streaming ? ' | Streaming' : ''}
        {stale ? ' (Stale)' : ''}
      </button>
      <button
        className="btn btn-start"
        type="button"
        onClick={onStart}
        disabled={!connected || streaming}
      >
        ▶ Start
      </button>
      <button className="btn" type="button" onClick={onStop} disabled={!connected || !streaming}>
        ⬛ Stop
      </button>
      <button className="btn" type="button" onClick={onPlot}>
        📊 Generate Plot
      </button>
      <button className="btn" type="button">
        ⚙ Configuration
      </button>
      <button className="btn" type="button">
        ⚙️ Preferences
      </button>
    </div>
  )
}
