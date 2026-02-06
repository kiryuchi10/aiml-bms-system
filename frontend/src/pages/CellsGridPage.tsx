/**
 * Cells Grid: cell cards from GET /api/v1/cells/latest; click opens Drawer with timeseries + alarm history.
 */

import { useCallback, useEffect, useState } from 'react'
import { getCellsLatest, type CellLatestRow } from '../services/apiV1'
import { CellDetailDrawer } from '../components/bms/CellDetailDrawer'
import '../styles/BMSDashboard.css'

const VEHICLE_ID = 1

function statusFromCell(c: CellLatestRow): 'normal' | 'warning' | 'fault' {
  const v = c.voltage ?? 0
  const t = c.temperature ?? 0
  if (v >= 4.2 || v <= 2.5 || t >= 45) return 'fault'
  if (v >= 4.0 || v <= 2.8 || t >= 35) return 'warning'
  return 'normal'
}

export function CellsGridPage() {
  const [cells, setCells] = useState<CellLatestRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [drawerCellId, setDrawerCellId] = useState<number | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    getCellsLatest(VEHICLE_ID)
      .then((r) => {
        setCells(r.cells ?? [])
        setError(null)
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const openDrawer = useCallback((cellId: number) => {
    setDrawerCellId(cellId)
    setDrawerOpen(true)
  }, [])
  const closeDrawer = useCallback(() => {
    setDrawerOpen(false)
    setDrawerCellId(null)
  }, [])

  const drawerCell = drawerCellId != null ? cells.find((c) => c.cell_id === drawerCellId) ?? null : null
  const normalCount = cells.filter((c) => statusFromCell(c) === 'normal').length
  const warningCount = cells.filter((c) => statusFromCell(c) === 'warning').length
  const faultCount = cells.filter((c) => statusFromCell(c) === 'fault').length
  const balancingCount = cells.filter((c) => c.balancing).length

  if (loading && cells.length === 0) {
    return (
      <div className="bms-dashboard page-body-inner cells-grid-page">
        <div className="loading-state">Loading cells…</div>
      </div>
    )
  }

  return (
    <div className="bms-dashboard page-body-inner cells-grid-page">
      <h1 className="page-title">Cells Grid</h1>
      {error && <div className="error-state">{error}</div>}

      <div className="control-bar" style={{ marginBottom: 16 }}>
        <button type="button" className="btn" onClick={load}>Refresh</button>
        <select className="filter-select" style={{ marginLeft: 'auto' }}>
          <option>Sort: Cell ID</option>
          <option>Sort: Worst Temperature</option>
          <option>Sort: Worst Voltage</option>
        </select>
      </div>

      <div className="summary-bar">
        <div className="summary-item">
          <div className="summary-label">Total Cells</div>
          <div className="summary-value">{cells.length}</div>
        </div>
        <div className="summary-item">
          <div className="summary-label">Normal</div>
          <div className="summary-value normal">{normalCount}</div>
        </div>
        <div className="summary-item">
          <div className="summary-label">Warning</div>
          <div className="summary-value warning">{warningCount}</div>
        </div>
        <div className="summary-item">
          <div className="summary-label">Fault</div>
          <div className="summary-value fault">{faultCount}</div>
        </div>
        <div className="summary-item">
          <div className="summary-label">Balancing</div>
          <div className="summary-value">{balancingCount}</div>
        </div>
      </div>

      <div className="cells-grid-cards">
        {cells.map((c) => {
          const status = statusFromCell(c)
          return (
            <div
              key={c.cell_id}
              role="button"
              tabIndex={0}
              className={`cell-card ${status}`}
              onClick={() => openDrawer(c.cell_id)}
              onKeyDown={(e) => e.key === 'Enter' && openDrawer(c.cell_id)}
            >
              <div className="cell-id">
                Cell {String(c.cell_id).padStart(2, '0')}
                <span className={`balancing-badge ${c.balancing ? '' : 'off'}`}>
                  {c.balancing ? 'BAL ON' : 'BAL OFF'}
                </span>
              </div>
              <div className="cell-metrics">
                <div className="metric-row">
                  <span className="metric-label">Voltage</span>
                  <span className="metric-value voltage">{c.voltage != null ? `${c.voltage.toFixed(3)} V` : '—'}</span>
                </div>
                <div className="metric-row">
                  <span className="metric-label">Temp</span>
                  <span className="metric-value temp">{c.temperature != null ? `${c.temperature.toFixed(1)} °C` : '—'}</span>
                </div>
                <div className="metric-row">
                  <span className="metric-label">SOC</span>
                  <span className="metric-value">{c.soc != null ? `${(c.soc * 100).toFixed(0)}%` : '—'}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
      {cells.length === 0 && !loading && <div className="empty-state">No cell data. Run NASA MAT ingest first.</div>}

      <CellDetailDrawer
        cellId={drawerCellId}
        cellLatest={drawerCell}
        open={drawerOpen}
        onClose={closeDrawer}
      />
    </div>
  )
}
