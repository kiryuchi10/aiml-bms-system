/**
 * Layout: Drilldown Map — Pack → Module → Cell navigation
 */

import React from 'react'
import '../../styles/BMSUIGallery.css'

export function LayoutDrilldownMapPage() {
  return (
    <div className="bms-ui-gallery">
      <div className="bms-3panel">
        <aside className="bms-3panel-left">
          <div className="text-sm font-semibold text-white/90">Drilldown</div>
          <div className="text-xs text-white/50 mt-1">Pack → Module → Cell</div>
          <nav className="mt-6 space-y-1">
            {['Pack 1', 'Pack 2', 'Pack 3'].map((label) => (
              <div key={label} className="rounded-xl px-3 py-2 text-sm text-white/70 hover:bg-white/5 cursor-pointer">
                {label}
              </div>
            ))}
          </nav>
        </aside>
        <main className="bms-3panel-main">
          <h1 className="text-lg font-semibold text-white mb-2">Layout: Drilldown Map</h1>
          <p className="text-xs text-white/50 mb-4">Click a level to drill down</p>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 mb-6">
            {Array.from({ length: 12 }, (_, i) => (
              <div
                key={i}
                className="bms-card p-3 text-center cursor-pointer hover:ring-1 hover:ring-[var(--bms-neon)]"
              >
                <div className="text-xs text-white/50">Module</div>
                <div className="text-white font-mono">E{i + 1}</div>
              </div>
            ))}
          </div>
          <div className="text-sm text-white/60">Select a module to see cells.</div>
        </main>
      </div>
    </div>
  )
}
