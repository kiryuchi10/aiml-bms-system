/**
 * CellsTable — cell-table; Cell, Voltage, Temp, Current, Abs SoC, SoH, Del. Est, Chg. Est.
 */
import type { DashboardResponse } from '../../types/bms'

function fmt(v?: number | null, unit?: string, digits = 2): string {
  if (v === undefined || v === null || Number.isNaN(v)) return '-'
  return `${Number(v).toFixed(digits)} ${unit ?? ''}`.trim()
}

type CellRow = DashboardResponse['cells'][number]

export function CellsTable({ cells }: { cells: CellRow[] }) {
  return (
    <table className="cell-table">
      <thead>
        <tr>
          <th>Cell</th>
          <th>Voltage</th>
          <th>Temp</th>
          <th>Current</th>
          <th>Abs SoC</th>
          <th>SoH</th>
          <th>Del. Est</th>
          <th>Chg. Est</th>
        </tr>
      </thead>
      <tbody>
        {(cells ?? []).map((c) => (
          <tr key={c.id}>
            <td>{String(c.id).padStart(2, '0')}</td>
            <td className="cell-active">{fmt(c.v, 'V', 4)}</td>
            <td className="cell-active">{fmt(c.t, '°C', 2)}</td>
            <td className="cell-active">{fmt(c.i, 'A', 3)}</td>
            <td>{c.soc ?? 0} %</td>
            <td>{fmt(c.soh, '%', 1)}</td>
            <td className="cell-active">{c.del_est ?? 100} %</td>
            <td className="cell-active">{c.chg_est ?? 100} %</td>
          </tr>
        ))}
        <tr className="cell-inactive">
          <td>11-16</td>
          <td colSpan={7}>No Data (Inactive Cells)</td>
        </tr>
      </tbody>
    </table>
  )
}
