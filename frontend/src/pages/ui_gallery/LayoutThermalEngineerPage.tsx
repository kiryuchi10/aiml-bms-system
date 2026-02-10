/**
 * Layout: Thermal Engineer View
 * - Center: large heatmap (module/cell)
 * - Right: coolant flow toggles + gradient chart + hotspot list
 * - Bottom: temp trend placeholder
 */

import React from 'react'
import '../../styles/BMSUIGallery.css'

export function LayoutThermalEngineerPage() {
  const modules = Array.from({ length: 12 }, (_, i) => ({
    id: `E${i + 1}`,
    temp: 32 + (i % 5) * 4 + (i === 4 ? 12 : 0),
    state: i === 4 ? 'warn' : i === 0 ? 'crit' : 'ok',
  }))

  return (
    <div className="bms-ui-gallery">
      <div className="bms-3panel">
        <aside className="bms-3panel-left">
          <div className="text-sm font-semibold text-white/90">Thermal</div>
          <div className="text-xs text-white/50 mt-1">Heatmap + cooling</div>
          <nav className="mt-6 space-y-1">
            {['Dashboard', 'Alarms', 'Charging', 'Thermal', 'MLOps', 'Fleet'].map((label) => (
              <div key={label} className="rounded-xl px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-white/5 cursor-pointer">
                {label}
              </div>
            ))}
          </nav>
        </aside>

        <main className="bms-3panel-main">
          <div className="flex items-end justify-between mb-4">
            <div>
              <h1 className="text-lg font-semibold text-white">Layout: Thermal Engineer</h1>
              <p className="text-xs text-white/50 mt-1">Heatmap + coolant + gradient</p>
            </div>
            <div className="flex items-center gap-2">
              <select className="rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-xs text-white/80">
                <option>PARQUET</option>
                <option>MAT</option>
                <option>DB</option>
              </select>
              <span className="text-xs text-white/40">Updated: 09:17</span>
            </div>
          </div>

          {/* Large heatmap placeholder */}
          <div className="bms-card p-4 mb-6">
            <div className="text-white/80 text-sm font-semibold mb-2">Module/Cell Thermal Heatmap</div>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {modules.map((m) => (
                <div
                  key={m.id}
                  className="rounded-xl border p-3 text-center transition hover:ring-1 hover:ring-[var(--bms-neon)]"
                  style={{
                    borderColor: 'rgba(255,255,255,0.12)',
                    background: m.state === 'crit' ? 'rgba(239,68,68,0.15)' : m.state === 'warn' ? 'rgba(251,191,36,0.12)' : 'rgba(255,255,255,0.03)',
                  }}
                >
                  <div className="text-white/85 font-semibold text-sm">{m.id}</div>
                  <div className="text-lg font-bold mt-1" style={{ color: m.state === 'crit' ? 'var(--bms-red)' : m.state === 'warn' ? 'var(--bms-amber)' : 'var(--bms-neon)' }}>
                    {m.temp}°C
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 text-xs text-white/40">TODO: Recharts heatmap or canvas</div>
          </div>

          {/* Coolant + gradient row */}
          <div className="grid grid-cols-12 gap-4 mb-6">
            <div className="col-span-12 md:col-span-4 bms-card">
              <div className="text-white/80 text-sm font-semibold mb-3">Coolant / Fans</div>
              <div className="space-y-2">
                {['Pump', 'Fan 1', 'Fan 2'].map((label, i) => (
                  <div key={label} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                    <span className="text-xs text-white/70">{label}</span>
                    <span className="text-xs text-[var(--bms-neon)]">ON</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="col-span-12 md:col-span-8 bms-card">
              <div className="text-white/80 text-sm font-semibold mb-2">Temperature Gradient</div>
              <div className="h-[140px] rounded-xl border border-white/10 bg-white/5 flex items-center justify-center text-white/40 text-xs">
                TODO: gradient chart
              </div>
            </div>
          </div>

          {/* Hotspot list + temp trend */}
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12 lg:col-span-4 bms-card">
              <div className="text-white/80 text-sm font-semibold mb-2">Hotspot Top 5</div>
              <ul className="space-y-2 text-xs text-white/60">
                <li>• E5 — 56°C</li>
                <li>• E1 — 54°C</li>
                <li>• E9 — 44°C</li>
                <li>• E6 — 42°C</li>
                <li>• E11 — 40°C</li>
              </ul>
            </div>
            <div className="col-span-12 lg:col-span-8 bms-card">
              <div className="text-white/80 text-sm font-semibold mb-2">Temp Trend</div>
              <div className="h-[180px] rounded-xl border border-white/10 bg-white/5 flex items-center justify-center text-white/40 text-xs">
                TODO: line chart
              </div>
            </div>
          </div>
        </main>

        <aside className="bms-3panel-right">
          <div className="text-white font-semibold">Inspector</div>
          <div className="text-xs text-white/50 mt-1">Select cell for detail</div>
          <div className="mt-4 bms-card">
            <div className="text-white/80 text-sm font-semibold">Selected</div>
            <div className="mt-2 text-xs text-white/60">Module: E5</div>
            <div className="text-xs text-white/60">Cell: 03</div>
            <div className="mt-3 h-px bg-white/10" />
            <div className="mt-3 text-xs text-white/60">MaxT: 56.2°C</div>
            <div className="text-xs text-white/60">Cooling: Active</div>
          </div>
        </aside>
      </div>
    </div>
  )
}

export default LayoutThermalEngineerPage
