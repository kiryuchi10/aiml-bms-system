/**
 * SocGaugeCard — Circular gauge (center %), Unusable SOC (optional), Usable SOC label.
 * Right/bottom: Remaining time proxy / To full proxy.
 */
export default function SocGaugeCard({
  soc,
  unusableSoc,
  remainingTime,
  toFull,
}: {
  soc?: number | null
  unusableSoc?: number | null
  remainingTime?: string | null
  toFull?: string | null
}) {
  const pct = soc != null ? (soc <= 1 ? soc * 100 : soc) : null
  return (
    <div className="soc-gauge-card card">
      <div className="soc-gauge-inner">
        {unusableSoc != null && <div className="soc-unusable">Unusable: {unusableSoc.toFixed(1)}%</div>}
        <div className="soc-value">{pct != null ? `${pct.toFixed(0)}%` : '—'}</div>
        <div className="soc-label">Usable SOC</div>
        {(remainingTime != null || toFull != null) && (
          <div className="soc-proxy">
            {remainingTime != null && <span>Remaining: {remainingTime}</span>}
            {toFull != null && <span>To full: {toFull}</span>}
          </div>
        )}
      </div>
    </div>
  )
}
