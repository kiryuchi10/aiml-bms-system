/**
 * SignalTile: current/voltage/temperature/status tile (right area).
 */
export function SignalTile({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <div className="signal-tile">
      <div className="signal-tile-label">{label}</div>
      <div className="signal-tile-value">{value} {unit}</div>
    </div>
  )
}
