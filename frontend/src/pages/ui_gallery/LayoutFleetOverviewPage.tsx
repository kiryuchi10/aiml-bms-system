/**
 * Layout: Fleet Overview
 * - Main: table of packs/vehicles with SoH, AE score, MaxT, ΔV, RUL + sparkline
 * - Right: selected pack inspector
 * - Top: filters (SoH&lt;, AE&gt;, Temp&gt;)
 */

import React, { useState } from 'react'
import '../../styles/BMSUIGallery.css'

const fleetRows = [
  { pack_id: 'B0005', soh: 92, ae: 0.64, maxT: 49, deltaV: 0.018, rul: 140 },
  { pack_id: 'B0006', soh: 88, ae: 0.71, maxT: 52, deltaV: 0.022, rul: 98 },
  { pack_id: 'B0007', soh: 95, ae: 0.55, maxT: 41, deltaV: 0.012, rul: 180 },
  { pack_id: 'B0018', soh: 78, ae: 0.82, maxT: 56, deltaV: 0.031, rul: 45 },
]

export function LayoutFleetOverviewPage() {
  const [selected, setSelected] = useState('B0005')
  const [filterSoh, setFilterSoh] = useState('')
  const [filterAe, setFilterAe] = useState('')

  const selectedRow = fleetRows.find((r) => r.pack_id === selected) ?? fleetRows[0]

  return (
    <div className="bms-ui-gallery">
      <div className="bms-3panel">
        <aside className="bms-3panel-left">
          <div className="text-sm font-semibold text-white/90">Fleet</div>
          <div className="text-xs text-white/50 mt-1">Packs / vehicles</div>
          <nav className="mt-6 space-y-1">
            {['Dashboard', 'Alarms', 'Fleet', 'MLOps'].map((label) => (
              <div key={label} className="rounded-xl px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-white/5 cursor-pointer">
                {label}
              </div>
            ))}
          </nav>
        </aside>

        <main className="bms-3panel-main">
          <div className="flex items-end justify-between mb-4">
            <div>
              <h1 className="text-lg font-semibold text-white">Layout: Fleet Overview</h1>
              <p className="text-xs text-white/50 mt-1">Table + sparkline + filters</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="SoH <"
                value={filterSoh}
                onChange={(e) => setFilterSoh(e.target.value)}
                className="w-20 rounded-lg border border-white/20 bg-white/5 px-2 py-1.5 text-xs text-white/80 placeholder-white/40"
              />
              <input
                type="text"
                placeholder="AE >"
                value={filterAe}
                onChange={(e) => setFilterAe(e.target.value)}
                className="w-20 rounded-lg border border-white/20 bg-white/5 px-2 py-1.5 text-xs text-white/80 placeholder-white/40"
              />
            </div>
          </div>

          <div className="bms-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-white/50 border-b border-white/10">
                  <th className="text-left py-3 px-3">Pack</th>
                  <th className="text-left py-3 px-3">SoH %</th>
                  <th className="text-left py-3 px-3">AE</th>
                  <th className="text-left py-3 px-3">MaxT °C</th>
                  <th className="text-left py-3 px-3">ΔV V</th>
                  <th className="text-left py-3 px-3">RUL cyc</th>
                  <th className="text-left py-3 px-3">Trend</th>
                </tr>
              </thead>
              <tbody className="text-white/80">
                {fleetRows.map((r) => {
                  const isSelected = selected === r.pack_id
                  const risk = r.soh < 80 || r.ae > 0.75 ? 'warn' : 'ok'
                  return (
                    <tr
                      key={r.pack_id}
                      onClick={() => setSelected(r.pack_id)}
                      className={`border-b border-white/5 cursor-pointer hover:bg-white/5 ${isSelected ? 'bg-white/10' : ''}`}
                    >
                      <td className="py-3 px-3 font-semibold">{r.pack_id}</td>
                      <td className="py-3 px-3" style={{ color: r.soh < 80 ? 'var(--bms-amber)' : undefined }}>
                        {r.soh}
                      </td>
                      <td className="py-3 px-3" style={{ color: r.ae > 0.75 ? 'var(--bms-amber)' : undefined }}>
                        {r.ae.toFixed(2)}
                      </td>
                      <td className="py-3 px-3">{r.maxT}</td>
                      <td className="py-3 px-3">{r.deltaV.toFixed(3)}</td>
                      <td className="py-3 px-3">{r.rul}</td>
                      <td className="py-3 px-3">
                        <div className="h-6 w-16 rounded border border-white/10 bg-white/5 flex items-center justify-center text-white/40 text-[10px]">
                          spark
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <div className="mt-2 text-xs text-white/40">TODO: real sparklines from API</div>
          </div>
        </main>

        <aside className="bms-3panel-right">
          <div className="text-white font-semibold">Pack Inspector</div>
          <div className="text-xs text-white/50 mt-1">Selected: {selected}</div>
          <div className="mt-4 bms-card">
            <div className="text-white/80 text-sm font-semibold">{selectedRow.pack_id}</div>
            <div className="mt-2 space-y-1 text-xs text-white/60">
              <div>SoH: {selectedRow.soh}%</div>
              <div>AE: {selectedRow.ae.toFixed(2)}</div>
              <div>MaxT: {selectedRow.maxT}°C</div>
              <div>ΔV: {selectedRow.deltaV.toFixed(3)} V</div>
              <div>RUL: {selectedRow.rul} cyc</div>
            </div>
            <div className="mt-4 h-px bg-white/10" />
            <div className="mt-3 text-xs text-white/50">TODO: drill to dashboard</div>
          </div>
        </aside>
      </div>
    </div>
  )
}

export default LayoutFleetOverviewPage
