/**
 * Analytics: SOC trend (24h), SOH trend (30d), Thermal Map, Aging Index heatmaps.
 * GET /api/v1/analytics/soc?hours=24, soh?days=30, thermal-map, aging.
 */

import { useEffect, useState } from 'react'
import {
  getAnalyticsSocTrend,
  getAnalyticsSohTrend,
  getAnalyticsThermalMap,
  getAnalyticsAging,
  type AnalyticsSocTrend,
  type AnalyticsSohTrend,
  type ThermalMapData,
  type AgingMapData,
} from '../services/apiV1'
import { LineChart, type LineChartPoint } from '../components/charts/LineChart'
import { HeatmapGrid } from '../components/charts/HeatmapGrid'
import '../styles/BMSDashboard.css'

export function AnalyticsPage() {
  const [socTrend, setSocTrend] = useState<AnalyticsSocTrend | null>(null)
  const [sohTrend, setSohTrend] = useState<AnalyticsSohTrend | null>(null)
  const [thermalMap, setThermalMap] = useState<ThermalMapData | null>(null)
  const [agingMap, setAgingMap] = useState<AgingMapData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    Promise.all([
      getAnalyticsSocTrend(24),
      getAnalyticsSohTrend(30),
      getAnalyticsThermalMap(),
      getAnalyticsAging(),
    ])
      .then(([soc, soh, therm, aging]) => {
        if (!cancelled) {
          setSocTrend(soc)
          setSohTrend(soh)
          setThermalMap(therm)
          setAgingMap(aging)
        }
      })
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [])

  if (loading) {
    return (
      <div className="bms-dashboard page-body-inner">
        <div className="loading-state">Loading analytics…</div>
      </div>
    )
  }
  if (error) {
    return (
      <div className="bms-dashboard page-body-inner">
        <div className="error-state">{error}</div>
      </div>
    )
  }

  const socPoints: LineChartPoint[] = (socTrend?.points ?? []).map((p, i) => ({
    t: i,
    value: p.soc_percent,
  }))
  const sohPoints: LineChartPoint[] = (sohTrend?.points ?? []).map((p) => ({
    t: p.day,
    value: p.soh_percent,
  }))

  return (
    <div className="bms-dashboard page-body-inner analytics-page">
      <h1 className="page-title">Analytics</h1>

      <section className="analytics-line-charts">
        <h2 className="section-label">SOC Trend (24h)</h2>
        {socPoints.length > 0 ? (
          <LineChart points={socPoints} label="SOC (%)" width={500} height={200} color="#2e7d32" />
        ) : (
          <div className="empty-state">No SOC trend data</div>
        )}
        <h2 className="section-label">SOH Trend (30d, demo proxy)</h2>
        {sohPoints.length > 0 ? (
          <LineChart points={sohPoints} label="SOH (%)" width={500} height={200} color="#1976d2" />
        ) : (
          <div className="empty-state">No SOH trend data</div>
        )}
      </section>

      <section className="analytics-heatmaps">
        <h2 className="section-label">Thermal Map (snapshot)</h2>
        {thermalMap?.values?.length ? (
          <HeatmapGrid
            values={thermalMap.values}
            status={thermalMap.status}
            label={`Pack temp: ${thermalMap.pack_temp ?? '—'} °C`}
            valueLabel={(v) => `${v} °C`}
          />
        ) : (
          <div className="empty-state">No thermal map</div>
        )}
        <h2 className="section-label">Aging Index (proxy)</h2>
        {agingMap?.values?.length ? (
          <HeatmapGrid
            values={agingMap.values}
            status={agingMap.status}
            label="Deviation from mean (mV)"
            valueLabel={(v) => v.toFixed(1)}
          />
        ) : (
          <div className="empty-state">No aging map</div>
        )}
      </section>
    </div>
  )
}
