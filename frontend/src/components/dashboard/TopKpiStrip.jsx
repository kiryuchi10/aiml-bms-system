/**
 * TopKpiStrip: 상단 KPI 스트립 — V, SoC, Temp(min/max), Imbalance, Current bar, Alarm status.
 */
import CurrentBar from "./CurrentBar";

function fmt(n, digits = 1) {
  if (n === null || n === undefined || Number.isNaN(n)) return "--";
  return Number(n).toFixed(digits);
}

export default function TopKpiStrip({
  moduleLabel = "M1",
  wsStatus = "closed",
  loading = false,
  packV,
  soc,
  tempMin,
  tempMax,
  imbalancePct,
  chargeMaxA = -35,
  currentA = 0,
  dischargeMaxA = 500,
  alarmFault = false,
}) {
  return (
    <div className="top-strip">
      <div className="top-left">
        <div className="mod-chip">
          <div className="mod-chip-title">{moduleLabel}</div>
          <div className="mod-chip-sub">MOD_1</div>
        </div>
        <div className={`ws-chip ${wsStatus}`}>WS: {wsStatus}</div>
        <div className="ws-chip minor">{loading ? "Loading..." : "Live"}</div>
      </div>
      <div className="kpi-row">
        <div className="kpi">
          <div className="kpi-title">V</div>
          <div className="kpi-value">{fmt(packV, 1)} V</div>
        </div>
        <div className="kpi">
          <div className="kpi-title">SoC</div>
          <div className="kpi-value">{fmt(soc, 1)} %</div>
        </div>
        <div className="kpi">
          <div className="kpi-title">Temp</div>
          <div className="kpi-sub">Min: {fmt(tempMin, 1)} °C</div>
          <div className="kpi-sub">Max: {fmt(tempMax, 1)} °C</div>
        </div>
        <div className="kpi">
          <div className="kpi-title">Imbalance</div>
          <div className="kpi-value">{fmt(imbalancePct, 2)} %</div>
        </div>
        <div className="kpi wide">
          <CurrentBar
            labelLeft="Charge Max"
            labelMid="Current"
            labelRight="Discharge Max"
            leftValue={chargeMaxA}
            midValue={Number(currentA ?? 0)}
            rightValue={dischargeMaxA}
          />
        </div>
        <div className={`kpi alarm ${alarmFault ? "fault" : "ok"}`}>
          <div className="kpi-title">Alarm</div>
          <div className="kpi-value">{alarmFault ? "Fault" : "Normal"}</div>
        </div>
      </div>
    </div>
  );
}
