/**
 * Layout: Balancing View
 * - Left: cell voltage distribution histogram
 * - Center: ΔV‑focused module grid
 * - Right: balancing control mock (sliders/toggles)
 * - Bottom: balancing target table
 */

import React from 'react'
import '../../styles/BMSUIGallery.css'

export function LayoutBalancingViewPage() {
  const cells = Array.from({ length: 12 }, (_, i) => ({ id: i + 1, v: 3.85 + (i % 4) * 0.02 + (i === 2 ? -0.05 : 0) }))
  const minV = Math.min(...cells.map((c) => c.v))
  const maxV = Math.max(...cells.map((c) => c.v))
  const deltaV = (maxV - minV).toFixed(3)

  return (
    <div className="bms-ui-gallery">
      <div className="bms-3panel">
        <aside className="bms-3panel-left">
          <div className="text-sm font-semibold text-white/90">Balancing</div>
          <div className="text-xs text-white/50 mt-1">ΔV / policy</div>
          <nav className="mt-6 space-y-1">
            {['Dashboard', 'Alarms', 'Thermal', 'Balancing', 'MLOps'].map((label) => (
              <div key={label} className="rounded-xl px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-white/5 cursor-pointer">
                {label}
              </div>
            ))}
          </nav>
        </aside>

        <main className="bms-3panel-main">
          <div className="flex items-end justify-between mb-4">
            <div>
              <h1 className="text-lg font-semibold text-white">Layout: Balancing View</h1>
              <p className="text-xs text-white/50 mt-1">Histogram + ΔV grid + policy mock</p>
            </div>
            <div className="text-xs text-white/40">ΔV pack: {deltaV} V</div>
          </div>

          <div className="grid grid-cols-12 gap-4 mb-6">
            {/* Histogram placeholder */}
            <div className="col-span-12 lg:col-span-4 bms-card">
              <div className="text-white/80 text-sm font-semibold mb-2">Cell Voltage Distribution</div>
              <div className="h-[200px] rounded-xl border border-white/10 bg-white/5 flex items-end justify-around px-2 pb-2 gap-1">
                {cells.map((c) => (
                  <div
                    key={c.id}
                    className="flex-1 rounded-t min-h-[4px]"
                    style={{
                      height: `${((c.v - minV) / (maxV - minV || 0.01)) * 80 + 10}%`,
                      background: c.v === minV ? 'var(--bms-red)' : c.v === maxV ? 'var(--bms-amber)' : 'var(--bms-neon)',
                      opacity: 0.85,
                    }}
                    title={`Cell ${c.id}: ${c.v.toFixed(3)}V`}
                  />
                ))}
              </div>
              <div className="mt-2 flex justify-between text-xs text-white/50">
                <span>Min: {minV.toFixed(3)}V</span>
                <span>Max: {maxV.toFixed(3)}V</span>
              </div>
            </div>

            {/* Module grid ΔV focus */}
            <div className="col-span-12 lg:col-span-5 bms-card">
              <div className="text-white/80 text-sm font-semibold mb-3">Module ΔV</div>
              <div className="grid grid-cols-4 gap-2">
                {Array.from({ length: 8 }, (_, i) => {
                  const d = (0.008 + (i % 3) * 0.005).toFixed(3)
                  const warn = Number(d) > 0.015
                  return (
                    <div
                      key={i}
                      className="rounded-xl border p-2 text-center"
                      style={{
                        borderColor: 'rgba(255,255,255,0.12)',
                        background: warn ? 'rgba(251,191,36,0.1)' : 'rgba(255,255,255,0.02)',
                      }}
                    >
                      <div className="text-white/70 text-xs">E{i + 1}</div>
                      <div className={`text-sm font-semibold ${warn ? 'text-[var(--bms-amber)]' : 'text-[var(--bms-neon)]'}`}>
                        {d} V
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Balancing control mock */}
            <div className="col-span-12 lg:col-span-3 bms-card">
              <div className="text-white/80 text-sm font-semibold mb-3">Policy (Mock)</div>
              <div className="space-y-3 text-xs text-white/60">
                <div className="flex justify-between items-center">
                  <span>Threshold ΔV</span>
                  <span className="text-white/80">0.015 V</span>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                  <div className="text-white/50 mb-1">Enable balancing</div>
                  <div className="text-[var(--bms-neon)]">ON</div>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                  <div className="text-white/50 mb-1">Target cells</div>
                  <div className="text-white/80">C02, C05, C08</div>
                </div>
              </div>
              <div className="mt-3 text-xs text-white/40">TODO: sliders / real control</div>
            </div>
          </div>

          {/* Balancing target table */}
          <div className="bms-card">
            <div className="text-white/80 text-sm font-semibold mb-3">Balancing Priority</div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-white/50 border-b border-white/10">
                    <th className="text-left py-2 px-2">Cell</th>
                    <th className="text-left py-2 px-2">V</th>
                    <th className="text-left py-2 px-2">Δ vs max</th>
                    <th className="text-left py-2 px-2">Action</th>
                  </tr>
                </thead>
                <tbody className="text-white/70">
                  {cells
                    .sort((a, b) => a.v - b.v)
                    .slice(0, 6)
                    .map((c) => (
                      <tr key={c.id} className="border-b border-white/5">
                        <td className="py-2 px-2">E1-C{String(c.id).padStart(2, '0')}</td>
                        <td className="py-2 px-2">{c.v.toFixed(3)}</td>
                        <td className="py-2 px-2">{(maxV - c.v).toFixed(3)}</td>
                        <td className="py-2 px-2 text-[var(--bms-neon)]">Balance</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>

        <aside className="bms-3panel-right">
          <div className="text-white font-semibold">Inspector</div>
          <div className="text-xs text-white/50 mt-1">Balancing status</div>
          <div className="mt-4 bms-card">
            <div className="text-white/80 text-sm font-semibold">Summary</div>
            <div className="mt-2 text-xs text-white/60">ΔV pack: {deltaV} V</div>
            <div className="text-xs text-white/60">Target cells: 3</div>
            <div className="mt-3 h-px bg-white/10" />
            <div className="mt-3 text-xs text-white/50">TODO: what-if preview</div>
          </div>
        </aside>
      </div>
    </div>
  )
}

export default LayoutBalancingViewPage
