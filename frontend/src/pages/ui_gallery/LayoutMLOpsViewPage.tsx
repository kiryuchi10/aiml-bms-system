/**
 * Layout: MLOps View
 * - Top: model cards (AE / SoH / RUL / SOC)
 * - Main: ROC curve + threshold slider + AE timeline
 * - Right: model registry (version / metrics)
 */

import React, { useState } from 'react'
import '../../styles/BMSUIGallery.css'

export function LayoutMLOpsViewPage() {
  const [threshold, setThreshold] = useState(70)

  const models = [
    { name: 'AE v1', task: 'ANOMALY', auc: '0.89', th: '0.72' },
    { name: 'SoH XGB v2', task: 'SOH', rmse: '0.023', r2: '0.91' },
    { name: 'RUL LSTM', task: 'RUL', mae: '12 cyc', r2: '0.85' },
    { name: 'SOC Kalman', task: 'SOC', mae: '1.2%', r2: '0.98' },
  ]

  return (
    <div className="bms-ui-gallery">
      <div className="bms-3panel">
        <aside className="bms-3panel-left">
          <div className="text-sm font-semibold text-white/90">MLOps</div>
          <div className="text-xs text-white/50 mt-1">ROC / Drift</div>
          <nav className="mt-6 space-y-1">
            {['Models', 'ROC / Threshold', 'Drift', 'Alerts'].map((label) => (
              <div key={label} className="rounded-xl px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-white/5 cursor-pointer">
                {label}
              </div>
            ))}
          </nav>
        </aside>

        <main className="bms-3panel-main">
          <div className="flex items-end justify-between mb-4">
            <div>
              <h1 className="text-lg font-semibold text-white">Layout: MLOps View</h1>
              <p className="text-xs text-white/50 mt-1">Model cards + ROC + threshold + AE timeline</p>
            </div>
            <div className="text-xs text-white/40">AUC-ROC / threshold tuning</div>
          </div>

          {/* Model cards row */}
          <div className="grid grid-cols-12 gap-4 mb-6">
            {models.map((m) => (
              <div key={m.name} className="col-span-12 sm:col-span-6 xl:col-span-3 bms-card">
                <div className="text-white/80 text-sm font-semibold">{m.name}</div>
                <div className="text-xs text-white/50 mt-1">{m.task}</div>
                <div className="mt-2 text-xs text-white/60">
                  {m.auc != null && `AUC: ${m.auc}`}
                  {m.rmse != null && `RMSE: ${m.rmse} R²: ${m.r2}`}
                  {m.mae != null && `MAE: ${m.mae}`}
                </div>
                {m.th != null && <div className="mt-1 text-xs text-[var(--bms-neon)]">th: {m.th}</div>}
              </div>
            ))}
          </div>

          {/* ROC + threshold + AE timeline */}
          <div className="grid grid-cols-12 gap-4 mb-6">
            <div className="col-span-12 xl:col-span-6 bms-card">
              <div className="text-white/80 text-sm font-semibold mb-2">ROC Curve</div>
              <div className="h-[220px] rounded-xl border border-white/10 bg-white/5 flex items-center justify-center text-white/40 text-xs mb-3">
                TODO: ROC plot (AUC 0.89)
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-white/50">Threshold</span>
                <input
                  type="range"
                  min={50}
                  max={95}
                  value={threshold}
                  onChange={(e) => setThreshold(Number(e.target.value))}
                  className="flex-1"
                />
                <span className="text-sm font-semibold text-white/80">{threshold / 100}</span>
              </div>
              <div className="mt-2 text-xs text-white/40">Alarms at this th: ~12 (simulated)</div>
            </div>
            <div className="col-span-12 xl:col-span-6 bms-card">
              <div className="text-white/80 text-sm font-semibold mb-2">AE Score Timeline</div>
              <div className="h-[260px] rounded-xl border border-white/10 bg-white/5 flex items-center justify-center text-white/40 text-xs">
                TODO: AE timeline + threshold line
              </div>
            </div>
          </div>

          {/* Drift PCA placeholder */}
          <div className="bms-card">
            <div className="text-white/80 text-sm font-semibold mb-2">Drift (PCA 2D)</div>
            <div className="h-[200px] rounded-xl border border-white/10 bg-white/5 flex items-center justify-center text-white/40 text-xs">
              TODO: scatter (cycle/sample, color by cluster)
            </div>
          </div>
        </main>

        <aside className="bms-3panel-right">
          <div className="text-white font-semibold">Model Registry</div>
          <div className="text-xs text-white/50 mt-1">Version / metrics</div>
          <div className="mt-4 space-y-3">
            {models.map((m) => (
              <div key={m.name} className="bms-card">
                <div className="text-white/80 text-sm font-semibold">{m.name}</div>
                <div className="mt-1 text-xs text-white/50">v1.0 — 2024-08-01</div>
                <div className="mt-2 text-xs text-white/60">
                  {m.auc != null && `AUC ${m.auc} · th ${m.th}`}
                  {m.rmse != null && `RMSE ${m.rmse}`}
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  )
}

export default LayoutMLOpsViewPage
