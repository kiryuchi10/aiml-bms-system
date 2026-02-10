/**
 * Layout: Charging Station — Charging session analysis
 */

import React from 'react'
import '../../styles/BMSUIGallery.css'

export function LayoutChargingStationPage() {
  return (
    <div className="bms-ui-gallery">
      <div className="mb-4">
        <h1 className="text-lg font-semibold text-white">Charging Station</h1>
        <p className="text-xs text-white/50 mt-1">Charging session analysis</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bms-card p-4">
          <div className="text-xs text-white/50 mb-1">Session</div>
          <div className="text-2xl font-bold text-white">DC Fast — 45 kW</div>
          <div className="text-sm text-white/60 mt-1">Started 09:00 · ETA 09:42</div>
        </div>
        <div className="bms-card p-4">
          <div className="text-xs text-white/50 mb-1">SoC</div>
          <div className="text-2xl font-bold text-[var(--bms-neon)]">68%</div>
          <div className="h-2 mt-2 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full rounded-full bg-[var(--bms-neon)]" style={{ width: '68%' }} />
          </div>
        </div>
      </div>
      <div className="bms-card p-4">
        <div className="text-sm text-white/80 mb-2">Session timeline</div>
        <div className="h-24 rounded bg-black/20" style={{ border: '1px solid var(--bms-line)' }} />
      </div>
    </div>
  )
}
