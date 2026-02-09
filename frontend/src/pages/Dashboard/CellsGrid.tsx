/**
 * Cells Grid Page
 * 목적: 셀 상태를 격자 형태로 즉시 파악
 * - Summary bar + cell grid + drawer(detail)
 * TODO: Export CSV, Sparkline real series, Drawer charts
 */

import { useEffect, useMemo, useState } from 'react'
import '../../styles/cellsGrid.css'
import { fetchCellGrid, type CellGridResponse } from '../../services/dashboardApi'
import CellsGridSummaryBar from '../../components/bms/CellsGridSummaryBar'
import CellCard from '../../components/bms/CellCard'
import { CellDetailDrawer } from '../../components/bms/CellDetailDrawer'

type SortKey = 'cell_id' | 'worst_temp' | 'worst_voltage' | 'imbalance'

export default function CellsGrid() {
  const packId = 'pack_1' // TODO: route param or store
  const [data, setData] = useState<CellGridResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>('cell_id')

  const [selectedCellId, setSelectedCellId] = useState<number | null>(null)
  const isDrawerOpen = selectedCellId !== null

  async function load() {
    setLoading(true)
    try {
      const d = await fetchCellGrid(packId)
      setData(d)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    const t = setInterval(load, 5000)
    return () => clearInterval(t)
  }, [])

  const sortedCells = useMemo(() => {
    if (!data) return []
    const cells = [...data.cells]
    const byCellId = (a: { cell_id: number }, b: { cell_id: number }) => a.cell_id - b.cell_id
    const byTempDesc = (a: { temp_c?: number }, b: { temp_c?: number }) => (b.temp_c ?? -Infinity) - (a.temp_c ?? -Infinity)
    const byVoltDesc = (a: { voltage_v?: number }, b: { voltage_v?: number }) => (b.voltage_v ?? -Infinity) - (a.voltage_v ?? -Infinity)

    if (sortKey === 'cell_id') return cells.sort(byCellId)
    if (sortKey === 'worst_temp') return cells.sort(byTempDesc)
    if (sortKey === 'worst_voltage') return cells.sort(byVoltDesc)
    if (sortKey === 'imbalance') return cells.sort(byVoltDesc)
    return cells
  }, [data, sortKey])

  const pageTs = data?.ts ? new Date(data.ts).toLocaleString() : '-'

  return (
    <div className="bms-container cells-grid-page">
      <div className="header">
        <div className="header-title">⚡ BMS - Cells Grid Monitor</div>
        <div>{pageTs}</div>
      </div>

      <div className="control-bar">
        <button type="button" className="btn" onClick={load} disabled={loading}>
          🔄 Refresh
        </button>
        <button
          type="button"
          className="btn"
          onClick={() => {
            // TODO: implement CSV export with current data
            alert('TODO: Export Data')
          }}
        >
          📊 Export Data
        </button>
        <select
          className="filter-select"
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as SortKey)}
        >
          <option value="cell_id">Sort: Cell ID</option>
          <option value="worst_temp">Sort: Worst Temperature</option>
          <option value="worst_voltage">Sort: Worst Voltage</option>
          <option value="imbalance">Sort: Imbalance</option>
        </select>
      </div>

      <div className="center-panel">
        <div className="page-header">
          <h1>🔋 Cells Grid - Real-Time Monitoring</h1>
        </div>

        <CellsGridSummaryBar summary={data?.summary} />

        <div className="cells-grid">
          {sortedCells.map((c) => (
            <CellCard
              key={c.cell_id}
              cell={c}
              onClick={() => setSelectedCellId(c.cell_id)}
            />
          ))}
        </div>
        {loading && data === null && <div className="loading-state">Loading cells…</div>}
        {!loading && data && data.cells.length === 0 && <div className="empty-state">No cell data. Run NASA MAT ingest first.</div>}
      </div>

      <CellDetailDrawer
        packId={packId}
        cellId={selectedCellId}
        open={isDrawerOpen}
        onClose={() => setSelectedCellId(null)}
      />
    </div>
  )
}
