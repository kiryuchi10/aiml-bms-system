/**
 * SelectedCellPanel — right-panel detail for selected cell + quick plot buttons.
 */
import { useNavigate } from 'react-router-dom'
import type { DashboardResponse } from '../../types/bms'

type CellRow = DashboardResponse['cells'][number]

function fmt(v?: number | null, unit?: string, digits = 2): string {
  if (v === undefined || v === null || Number.isNaN(v)) return '-'
  return `${Number(v).toFixed(digits)} ${unit ?? ''}`.trim()
}

export function SelectedCellPanel({
  vehicleId,
  cell,
}: {
  vehicleId: string
  cell: CellRow | null
}) {
  const nav = useNavigate()

  if (!cell) {
    return (
      <div
        style={{
          padding: 12,
          border: '1px solid #ddd',
          borderRadius: 6,
          background: '#fff',
          marginBottom: 12,
        }}
      >
        <div style={{ fontWeight: 800, marginBottom: 8 }}>Selected Cell</div>
        <div style={{ fontSize: 12, color: '#666' }}>Click a cell in the grid to see details.</div>
      </div>
    )
  }

  return (
    <div
      style={{
        padding: 12,
        border: '1px solid #ddd',
        borderRadius: 6,
        background: '#fff',
        marginBottom: 12,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontWeight: 900 }}>
          Selected: Cell {String(cell.id).padStart(2, '0')}
        </div>
        <span style={{ fontSize: 11, color: '#666' }}>
          {cell.bal ? 'Balancing ON' : 'Balancing OFF'}
        </span>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 8,
          marginTop: 10,
        }}
      >
        <K label="Voltage" value={fmt(cell.v, 'V', 4)} />
        <K label="Temp" value={fmt(cell.t, '°C', 2)} />
        <K label="Current" value={fmt(cell.i, 'A', 3)} />
        <K label="SoC" value={cell.soc != null ? `${cell.soc} %` : '-'} />
        <K label="SoH" value={fmt(cell.soh, '%', 1)} />
        <K label="Alarm" value={cell.alarm ? 'ACTIVE' : 'OK'} />
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
        <button
          type="button"
          className="btn"
          onClick={() =>
            nav(
              `/dashboard/plot?vehicle_id=${encodeURIComponent(vehicleId)}&metric=pack_voltage&window=600`
            )
          }
        >
          Plot Pack Voltage
        </button>
        <button
          type="button"
          className="btn"
          onClick={() =>
            nav(
              `/dashboard/plot?vehicle_id=${encodeURIComponent(vehicleId)}&metric=pack_temp&window=600`
            )
          }
        >
          Plot Pack Temp
        </button>
      </div>
    </div>
  )
}

function K({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        padding: 10,
        border: '1px solid #eee',
        borderRadius: 6,
        background: '#fafafa',
      }}
    >
      <div style={{ fontSize: 10, color: '#666', fontWeight: 700, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 900, color: '#222' }}>{value}</div>
    </div>
  )
}
