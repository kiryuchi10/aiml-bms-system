/**
 * Layout: Alarm Driven — Alarm-centric analysis
 */

import React from 'react'
import '../../styles/BMSUIGallery.css'

export function LayoutAlarmDrivenPage() {
  const items = [
    { id: 1, type: 'over_voltage', severity: 'red', cell: 4, ts: '09:17' },
    { id: 2, type: 'over_temp', severity: 'amber', cell: 12, ts: '09:15' },
  ]
  return (
    <div className="bms-ui-gallery">
      <div className="mb-4">
        <h1 className="text-lg font-semibold text-white">Alarm Driven</h1>
        <p className="text-xs text-white/50 mt-1">Alarm-centric analysis view</p>
      </div>
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-6">
          <div className="text-sm font-semibold text-white/90 mb-2">Active alarms</div>
          <ul className="space-y-2">
            {items.map((a) => (
              <li
                key={a.id}
                className="bms-card p-3 flex items-center justify-between"
                style={{
                  borderLeft: `3px solid ${a.severity === 'red' ? 'var(--bms-red)' : 'var(--bms-amber)'}`,
                }}
              >
                <span className="text-white/90">{a.type}</span>
                <span className="text-xs text-white/50">Cell {a.cell} · {a.ts}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="col-span-12 lg:col-span-6">
          <div className="text-sm font-semibold text-white/90 mb-2">Evidence / context</div>
          <div className="bms-card p-4">
            <p className="text-sm text-white/70">Select an alarm to see evidence and recommended actions.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
