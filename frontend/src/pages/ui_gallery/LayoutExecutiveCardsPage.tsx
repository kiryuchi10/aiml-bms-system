/**
 * Layout: Executive Cards — KPI-centred summary
 */

import React from 'react'
import '../../styles/BMSUIGallery.css'

export function LayoutExecutiveCardsPage() {
  const cards = [
    { title: 'Fleet SoH', value: '94%', trend: 'up', sub: '12 vehicles' },
    { title: 'Active Alarms', value: '2', trend: 'down', sub: 'Last 24h' },
    { title: 'Avg SoC', value: '72%', trend: 'neutral', sub: 'Fleet' },
    { title: 'Charging', value: '3', trend: 'neutral', sub: 'In progress' },
  ]
  return (
    <div className="bms-ui-gallery">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white">Executive Cards</h1>
        <p className="text-xs text-white/50 mt-1">KPI-centred summary view</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.title} className="bms-card hover:translate-y-[-2px] transition">
            <div className="text-xs text-white/50 uppercase tracking-wider">{c.title}</div>
            <div className="text-3xl font-bold text-white mt-2">{c.value}</div>
            <div className="text-xs text-white/40 mt-1">{c.sub}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
