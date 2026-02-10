/**
 * Layout: Chronological Playback — Playback / scrubber based
 */

import React from 'react'
import '../../styles/BMSUIGallery.css'

export function LayoutChronologicalPlaybackPage() {
  return (
    <div className="bms-ui-gallery">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-white">Chronological Playback</h1>
        <div className="flex items-center gap-2">
          <button type="button" className="rounded-lg border px-3 py-1.5 text-sm text-white/80" style={{ borderColor: 'var(--bms-line)' }}>
            ◀ Prev
          </button>
          <button type="button" className="rounded-lg bg-[var(--bms-neon)] px-3 py-1.5 text-sm text-black font-medium">
            ▶ Play
          </button>
          <button type="button" className="rounded-lg border px-3 py-1.5 text-sm text-white/80" style={{ borderColor: 'var(--bms-line)' }}>
            Next ▶
          </button>
        </div>
      </div>
      <div className="bms-card p-4 mb-4">
        <div className="text-xs text-white/50 mb-2">Timeline scrubber</div>
        <div className="h-10 rounded bg-black/30" style={{ border: '1px solid var(--bms-line)' }} />
        <div className="flex justify-between mt-1 text-[10px] text-white/40">00:00 — 12:00</div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bms-card p-4">
          <div className="text-sm text-white/80 mb-2">Pack telemetry</div>
          <div className="h-32 rounded bg-black/20" style={{ border: '1px solid var(--bms-line)' }} />
        </div>
        <div className="bms-card p-4">
          <div className="text-sm text-white/80 mb-2">Cell snapshot</div>
          <div className="h-32 rounded bg-black/20" style={{ border: '1px solid var(--bms-line)' }} />
        </div>
      </div>
    </div>
  )
}
