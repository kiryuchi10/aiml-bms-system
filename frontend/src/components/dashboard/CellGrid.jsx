/**
 * CellGrid: E1..E12 또는 E1..E18 셀 그리드.
 */
import CellTile from "./CellTile";

export default function CellGrid({ cells = [], socFallback }) {
  return (
    <div className="bms-panel">
      <div className="panel-title">Cells</div>
      <div className="cell-grid">
        {cells.map((c) => (
          <CellTile
            key={c.cell_id ?? c.cellId ?? c.id ?? Math.random()}
            cell={c}
            socFallback={socFallback}
          />
        ))}
      </div>
    </div>
  );
}
