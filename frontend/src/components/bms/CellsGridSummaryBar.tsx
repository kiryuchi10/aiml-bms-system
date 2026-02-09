type Summary = {
  total: number
  normal: number
  warning: number
  fault: number
  balancing_on: number
}

export default function CellsGridSummaryBar({ summary }: { summary?: Summary }) {
  const s = summary ?? { total: 0, normal: 0, warning: 0, fault: 0, balancing_on: 0 }

  return (
    <div className="summary-bar">
      <SummaryItem label="Total Cells" value={s.total} />
      <SummaryItem label="Normal" value={s.normal} tone="normal" />
      <SummaryItem label="Warning" value={s.warning} tone="warning" />
      <SummaryItem label="Fault" value={s.fault} tone="fault" />
      <SummaryItem label="Balancing" value={s.balancing_on} />
    </div>
  )
}

function SummaryItem({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone?: 'normal' | 'warning' | 'fault'
}) {
  return (
    <div className="summary-item">
      <div className="summary-label">{label}</div>
      <div className={`summary-value ${tone ?? ''}`}>{value}</div>
    </div>
  )
}
