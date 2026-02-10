/**
 * BMS UI Gallery – 12 layout patterns (PC, Dark + Soft Neon)
 * Links to Part 1 (6) + Part 2 (5) + Minimal Industrial.
 */

import React from 'react'
import { Link } from 'react-router-dom'
import '../styles/BMSUIGallery.css'

const ITEMS: { to: string; title: string; desc: string }[] = [
  { to: '/bms/ui/layout-3panel-ops', title: '3-Panel Ops', desc: 'LeftNav + MainGrid + RightInspector' },
  { to: '/bms/ui/layout-control-room-wall', title: 'Control Room Wall', desc: 'Top status bar + huge grid + 4 charts' },
  { to: '/bms/ui/layout-executive-cards', title: 'Executive Cards', desc: 'KPI 중심 요약형' },
  { to: '/bms/ui/layout-drilldown-map', title: 'Drilldown Map', desc: 'Pack→Module→Cell 탐색' },
  { to: '/bms/ui/layout-chronological-playback', title: 'Chronological Playback', desc: '재생/스크러버 기반' },
  { to: '/bms/ui/layout-alarm-driven', title: 'Alarm Driven', desc: '알람 중심 분석' },
  { to: '/bms/ui/layout-charging-station', title: 'Charging Station', desc: '충전 세션 분석' },
  { to: '/bms/ui/layout-thermal-engineer', title: 'Thermal Engineer', desc: 'Heatmap + 냉각/구배' },
  { to: '/bms/ui/layout-balancing-view', title: 'Balancing View', desc: 'ΔV/분포/정책 시뮬' },
  { to: '/bms/ui/layout-mlops-view', title: 'MLOps View', desc: 'ROC/AUC/Threshold + Drift' },
  { to: '/bms/ui/layout-fleet-overview', title: 'Fleet Overview', desc: '팩/차량 테이블' },
  { to: '/bms/ui/layout-minimal-industrial', title: 'Minimal Industrial', desc: '얇은 라인 + 숫자 크게' },
]

export function UIGalleryPage() {
  return (
    <div className="bms-ui-gallery" style={{ minHeight: '100%', padding: '1.5rem' }}>
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">BMS UI Gallery (PC)</h1>
          <p className="text-white/60 mt-1">Neon pill 기반 레이아웃 12종</p>
        </div>
        <div className="text-xs text-white/50">Theme: Dark + Soft Neon (#7CFF6B)</div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {ITEMS.map((it) => (
          <Link key={it.to} to={it.to} className="col-span-12 md:col-span-6 xl:col-span-4">
            <div
              className="bms-card hover:translate-y-[-2px] transition"
              style={{ height: '100%' }}
            >
              <div className="flex items-center justify-between">
                <div className="text-white font-semibold">{it.title}</div>
                <span className="bms-neon-dot" />
              </div>
              <div className="mt-2 text-sm text-white/60">{it.desc}</div>
              <div className="mt-4 h-px w-full bg-white/10" />
              <div className="mt-3 text-xs text-white/40">Open →</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default UIGalleryPage
