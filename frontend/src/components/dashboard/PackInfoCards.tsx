/**
 * PackInfoCards — 2×2: SoH (highlight), Remaining, CC Charge, To Full.
 * Tooltip for “추정 근거” (model/rule source).
 */
export default function PackInfoCards({
  soh,
  remainingTime,
  ccCharge,
  toFull,
}: {
  soh?: number | null
  remainingTime?: string | number | null
  ccCharge?: string | number | null
  toFull?: string | number | null
}) {
  const sohPct = soh != null ? (soh <= 1 ? soh * 100 : soh) : null
  return (
    <div className="pack-info-cards grid2">
      <div className="card pack-info-card soh-card" title="SoH (model/rule)">
        <span className="label">SoH</span>
        <span className="value">{sohPct != null ? `${sohPct.toFixed(1)}%` : '—'}</span>
      </div>
      <div className="card pack-info-card" title="Remaining (proxy)">
        <span className="label">Remaining</span>
        <span className="value">{remainingTime != null ? String(remainingTime) : '—'}</span>
      </div>
      <div className="card pack-info-card" title="CC Charge">
        <span className="label">CC Charge</span>
        <span className="value">{ccCharge != null ? String(ccCharge) : '—'}</span>
      </div>
      <div className="card pack-info-card" title="To Full (proxy)">
        <span className="label">To Full</span>
        <span className="value">{toFull != null ? String(toFull) : '—'}</span>
      </div>
    </div>
  )
}
