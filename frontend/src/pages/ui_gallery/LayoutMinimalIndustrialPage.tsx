/**
 * Layout: Minimal Industrial
 * - Black + thin white lines, big numbers, minimal charts
 * - KPI row (6 large numbers) + line-box module grid + 2 charts only
 * - Alarms as red line / text only
 */

import React from 'react'
import '../../styles/BMSUIGallery.css'

export function LayoutMinimalIndustrialPage() {
  const kpis = [
    { label: 'V', value: '392.4', unit: 'V' },
    { label: 'I', value: '-18.2', unit: 'A' },
    { label: 'SoC', value: '68', unit: '%' },
    { label: 'SoH', value: '92', unit: '%' },
    { label: 'T', value: '49', unit: '°C' },
    { label: 'ΔV', value: '0.018', unit: 'V' },
  ]

  const modules = Array.from({ length: 12 }, (_, i) => `E${i + 1}`)

  return (
    <div className="bms-ui-gallery">
      <div className="bms-3panel">
        <aside className="bms-3panel-left">
          <div className="text-sm font-semibold text-white/90">Minimal</div>
          <div className="text-xs text-white/50 mt-1">Industrial HMI</div>
          <nav className="mt-6 space-y-1">
            {['Ops', 'Alarms', 'Config'].map((label) => (
              <div key={label} className="rounded-xl px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-white/5 cursor-pointer">
                {label}
              </div>
            ))}
          </nav>
        </aside>

        <main className="bms-3panel-main">
          <div className="mb-6">
            <h1 className="text-lg font-semibold text-white mb-1">Layout: Minimal Industrial</h1>
            <p className="text-xs text-white/50">Thin lines + big numbers only</p>
          </div>

          {/* KPI row: 6 large numbers */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            {kpis.map((k) => (
              <div
                key={k.label}
                className="rounded-lg border p-4 text-center"
                style={{ borderColor: 'rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.02)' }}
              >
                <div className="text-[10px] text-white/50 uppercase tracking-wider">{k.label}</div>
                <div className="text-3xl font-bold text-white mt-1 tracking-tight">
                  {k.value}
                  <span className="text-lg font-normal text-white/60 ml-0.5">{k.unit}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Module grid: line boxes only */}
          <div className="mb-6">
            <div className="text-xs text-white/50 mb-2">Modules</div>
            <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-2">
              {modules.map((id, i) => (
                <div
                  key={id}
                  className="rounded border py-3 text-center text-white/80 text-sm font-mono"
                  style={{
                    borderColor: 'rgba(255,255,255,0.12)',
                    background: i === 0 ? 'rgba(239,68,68,0.08)' : i === 4 ? 'rgba(251,191,36,0.06)' : 'transparent',
                  }}
                >
                  {id}
                </div>
              ))}
            </div>
          </div>

          {/* 2 charts only */}
          <div className="grid grid-cols-12 gap-4 mb-6">
            <div className="col-span-12 lg:col-span-6 rounded-lg border p-4" style={{ borderColor: 'rgba(255,255,255,0.12)' }}>
              <div className="text-[10px] text-white/50 uppercase tracking-wider mb-2">SoC</div>
              <div className="h-[200px] rounded border border-white/10 bg-black/20 flex items-center justify-center text-white/30 text-xs">
                chart
              </div>
            </div>
            <div className="col-span-12 lg:col-span-6 rounded-lg border p-4" style={{ borderColor: 'rgba(255,255,255,0.12)' }}>
              <div className="text-[10px] text-white/50 uppercase tracking-wider mb-2">Temp</div>
              <div className="h-[200px] rounded border border-white/10 bg-black/20 flex items-center justify-center text-white/30 text-xs">
                chart
              </div>
            </div>
          </div>

          {/* Alarms: text only */}
          <div className="rounded-lg border p-3" style={{ borderColor: 'rgba(255,255,255,0.12)' }}>
            <div className="text-[10px] text-white/50 uppercase tracking-wider mb-2">Alarms</div>
            <div className="space-y-1 text-sm">
              <div className="text-[var(--bms-red)]">CRIT E1 SoC &lt; 20%</div>
              <div className="text-[var(--bms-amber)]">WARN E5 Temp rise</div>
              <div className="text-white/50">INFO E3 Charging</div>
            </div>
          </div>
        </main>

        <aside className="bms-3panel-right">
          <div className="text-white font-semibold text-sm">Status</div>
          <div className="text-xs text-white/50 mt-1">Minimal</div>
          <div className="mt-4 rounded-lg border p-3 text-xs text-white/60" style={{ borderColor: 'rgba(255,255,255,0.12)' }}>
            <div>API: ONLINE</div>
            <div className="mt-1">Source: PARQUET</div>
          </div>
        </aside>
      </div>
    </div>
  )
}

export default LayoutMinimalIndustrialPage
