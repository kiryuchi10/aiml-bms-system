/**
 * Layout: Control Room Wall — Top status bar + huge grid + 4 charts
 */

import React from 'react'
import '../../styles/BMSUIGallery.css'

export function LayoutControlRoomWallPage() {
  return (
    <div className="bms-ui-gallery">
      <div className="border-b mb-4 pb-4" style={{ borderColor: 'var(--bms-line)' }}>
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-white">Control Room Wall</h1>
          <div className="flex items-center gap-4 text-sm text-white/70">
            <span><span className="bms-neon-dot inline-block mr-2" />Live</span>
            <span>09:17:42</span>
            <span>Vehicle 1</span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-12 gap-4 mb-6">
        {Array.from({ length: 24 }, (_, i) => (
          <div key={i} className="col-span-12 sm:col-span-6 lg:col-span-4 xl:col-span-3 bms-card p-3">
            <div className="text-[10px] text-white/50">M{i + 1}</div>
            <div className="text-lg font-mono text-white mt-1">3.82V</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {['Pack V', 'Pack I', 'Temp', 'SoC'].map((label) => (
          <div key={label} className="bms-card p-4">
            <div className="text-sm text-white/80 mb-2">{label}</div>
            <div className="h-24 rounded bg-black/20" style={{ border: '1px solid var(--bms-line)' }} />
          </div>
        ))}
      </div>
    </div>
  )
}
