/**
 * SocSection — soc-gauge, soc-circle, pack-info; SoC/SoH, remaining time, CC charge, to full.
 */
import type { DashboardResponse } from '../../types/bms'

export function SocSection({ pack }: { pack: DashboardResponse['pack'] }) {
  const soc = pack?.soc ?? 0
  const soh = pack?.soh ?? 0

  return (
    <div className="soc-section">
      <div className="soc-gauge">
        <div className="soc-label">Unusable Pack SoC: 0%</div>
        <div className="soc-circle">
          <div className="soc-percentage">{Number(soc).toFixed(2)}%</div>
        </div>
        <div className="soc-label">Usable Pack SoC</div>
      </div>

      <div className="pack-info">
        <div className="info-card">
          <span className="info-label">Pack SoH</span>
          <span className="info-value green">{Number(soh).toFixed(0)}%</span>
        </div>
        <div className="info-card">
          <span className="info-label">Remaining Time</span>
          <span className="info-value">{pack?.remaining_time ?? '-'}</span>
        </div>
        <div className="info-card">
          <span className="info-label">CC Charge</span>
          <span className="info-value">{pack?.cc_charge ?? '-'}</span>
        </div>
        <div className="info-card">
          <span className="info-label">To Full</span>
          <span className="info-value">{pack?.to_full ?? '-'}</span>
        </div>
      </div>
    </div>
  )
}
