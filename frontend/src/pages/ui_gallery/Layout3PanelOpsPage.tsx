/**
 * Layout: 3-Panel Ops — LeftNav + MainGrid + RightInspector
 */

import React from 'react'
import '../../styles/BMSUIGallery.css'

export function Layout3PanelOpsPage() {
  return (
    <div className="bms-ui-gallery">
      <div className="bms-3panel">
        <aside className="bms-3panel-left">
          <div className="text-sm font-semibold text-white/90">3-Panel Ops</div>
          <div className="text-xs text-white/50 mt-1">LeftNav + Main + Inspector</div>
          <nav className="mt-6 space-y-1">
            {['Dashboard', 'Cells', 'Alarms', 'Thermal', 'ML', 'Config'].map((label) => (
              <div key={label} className="rounded-xl px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-white/5 cursor-pointer">
                {label}
              </div>
            ))}
          </nav>
        </aside>
        <main className="bms-3panel-main">
          <h1 className="text-lg font-semibold text-white mb-2">Layout: 3-Panel Ops</h1>
          <p className="text-xs text-white/50 mb-4">Main grid area — pack/cell summary</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['V', 'I', 'SoC', 'T'].map((k) => (
              <div key={k} className="bms-card">
                <div className="text-xs text-white/50">{k}</div>
                <div className="text-xl font-bold text-white mt-1">—</div>
              </div>
            ))}
          </div>
        </main>
        <aside className="bms-3panel-right">
          <div className="text-sm font-semibold text-white/90">Right Inspector</div>
          <div className="text-xs text-white/50 mt-1">Selection details</div>
          <div className="mt-4 bms-card">
            <p className="text-sm text-white/70">Select a cell or alarm to inspect.</p>
          </div>
        </aside>
      </div>
    </div>
  )
}
