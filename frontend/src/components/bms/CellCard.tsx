import type { CellGridItem } from '../../services/dashboardApi'

export default function CellCard({
  cell,
  onClick,
}: {
  cell: CellGridItem
  onClick: () => void
}) {
  const statusClass = cell.status ?? 'normal'
  const balOn = !!cell.balancing

  return (
    <div className={`cell-card ${statusClass}`} onClick={onClick} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && onClick()}>
      <div className="cell-id">
        Cell {String(cell.cell_id).padStart(2, '0')}
        <span className={`balancing-badge ${balOn ? '' : 'off'}`}>
          {balOn ? 'BAL ON' : 'BAL OFF'}
        </span>
      </div>

      <div className="cell-metrics">
        <MetricRow label="⚡ Voltage" value={`${fmt(cell.voltage_v)} V`} valueClass="voltage" />
        <MetricRow label="🔥 Temp" value={`${fmt(cell.temp_c)} °C`} valueClass="temp" />
        <MetricRow label="🔋 SOC" value={`${fmt(cell.soc)}%`} />
      </div>

      {/* TODO: sparkline should be real mini series */}
      <div className="mini-sparkline">
        <div className="sparkline-bar" style={{ left: '10%', height: '80%' }} />
        <div className="sparkline-bar" style={{ left: '20%', height: '75%' }} />
        <div className="sparkline-bar" style={{ left: '30%', height: '85%' }} />
        <div className="sparkline-bar" style={{ left: '40%', height: '90%' }} />
      </div>
    </div>
  )
}

function MetricRow({
  label,
  value,
  valueClass,
}: {
  label: string
  value: string
  valueClass?: string
}) {
  return (
    <div className="metric-row">
      <span className="metric-label">{label}</span>
      <span className={`metric-value ${valueClass ?? ''}`}>{value}</span>
    </div>
  )
}

function fmt(n?: number | null) {
  if (n === null || n === undefined) return '-'
  return Number.isInteger(n) ? String(n) : (n as number).toFixed(3)
}
