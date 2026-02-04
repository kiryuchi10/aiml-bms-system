/**
 * CellTile: voltage/temperature 기반 OK/WARN/DANGER, BAL/OFF 표시.
 */
function statusByCell(cell) {
  if (cell.status) return cell.status;
  const v = Number(cell.voltage);
  const t = Number(cell.temperature);
  if (Number.isFinite(t) && t >= 60) return "DANGER";
  if (Number.isFinite(v) && (v >= 4.25 || v <= 2.5)) return "DANGER";
  if (Number.isFinite(t) && t >= 50) return "WARN";
  if (Number.isFinite(v) && (v >= 4.2 || v <= 2.7)) return "WARN";
  return "OK";
}

export default function CellTile({ cell, socFallback }) {
  const st = statusByCell(cell);
  const cls =
    st === "DANGER" ? "cell danger" : st === "WARN" ? "cell warn" : "cell ok";
  const v = Number.isFinite(cell.voltage) ? cell.voltage.toFixed(2) : "--";
  const soc = Number.isFinite(cell.soc)
    ? cell.soc.toFixed(1)
    : Number.isFinite(socFallback)
      ? Number(socFallback).toFixed(1)
      : "--";

  return (
    <div className={cls}>
      <div className="cell-top">
        <div className="cell-id">{cell.cell_id ?? cell.cellId ?? "--"}</div>
        {cell.is_active === false ? (
          <div className="cell-badge off">OFF</div>
        ) : null}
        {cell.is_active === true && cell.balancing ? (
          <div className="cell-badge bal">BAL</div>
        ) : null}
      </div>
      <div className="cell-v">{v} V</div>
      <div className="cell-soc">SoC {soc} %</div>
    </div>
  );
}
