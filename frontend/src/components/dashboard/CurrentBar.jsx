/**
 * CurrentBar: Charge Max(좌) / Current(중) / Discharge Max(우) 바.
 * Props: labelLeft, labelMid, labelRight, leftValue, midValue, rightValue (A 단위).
 */
export default function CurrentBar({
  labelLeft = "Charge Max",
  labelMid = "Current",
  labelRight = "Discharge Max",
  leftValue = 0,
  midValue = 0,
  rightValue = 0,
}) {
  const maxAbs = Math.max(
    Math.abs(leftValue || 0),
    Math.abs(rightValue || 0),
    Math.abs(midValue || 0),
    1
  );
  const mid = Math.max(-maxAbs, Math.min(maxAbs, midValue || 0));
  const pctLeft = Math.max(0, Math.min(50, (Math.abs(Math.min(0, mid)) / maxAbs) * 50));
  const pctRight = Math.max(0, Math.min(50, (Math.max(0, mid) / maxAbs) * 50));

  return (
    <div className="kpi-current">
      <div className="kpi-current-head">
        <div className="kpi-current-label">{labelLeft}</div>
        <div className="kpi-current-label">{labelMid}</div>
        <div className="kpi-current-label">{labelRight}</div>
      </div>
      <div className="kpi-current-values">
        <div className="kpi-current-v">{Number(leftValue)} A</div>
        <div className="kpi-current-v">{Number(midValue)} A</div>
        <div className="kpi-current-v">{Number(rightValue)} A</div>
      </div>
      <div className="kpi-current-bar">
        <div className="kpi-current-zero" />
        <div className="kpi-current-left" style={{ width: `${pctLeft}%` }} />
        <div className="kpi-current-right" style={{ width: `${pctRight}%` }} />
      </div>
    </div>
  );
}
