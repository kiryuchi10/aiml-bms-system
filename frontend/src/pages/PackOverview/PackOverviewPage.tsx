/**
 * PackOverviewPage — Pack Real Time Status; CellGrid click → confirm modal with eligibility + policy; toast.
 */
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShellLayout } from '../../components/layout/ShellLayout'
import { PackMetricsGrid } from '../../components/pack/PackMetricsGrid'
import { SocSection } from '../../components/pack/SocSection'
import { CellGrid } from '../../components/cells/CellGrid'
import { CellsTable } from '../../components/cells/CellsTable'
import { LearningsPanel } from '../../components/panels/LearningsPanel'
import { AlarmsPanel } from '../../components/panels/AlarmsPanel'
import { SelectedCellPanel } from '../../components/panels/SelectedCellPanel'
import { Modal } from '../../components/ui/Modal'
import { ToastStack } from '../../components/ui/ToastStack'
import { useDashboardInit } from '../../hooks/useDashboardInit'
import { useBmsStream } from '../../hooks/useBmsStream'
import { useToast } from '../../hooks/useToast'
import { fetchBalancePolicy, type BalancePolicy } from '../../services/api'
import type { DashboardResponse } from '../../types/bms'

const DEFAULT_VEHICLE_ID = import.meta.env.VITE_VEHICLE_ID ?? 'MBM165-P50-B'

type CellRow = DashboardResponse['cells'][number]

function evaluateBalanceEligibility(
  cellId: number,
  cells: CellRow[],
  policy: BalancePolicy | null,
  packMeanV: number
): { allowed: boolean; reason: string | null; detail: string } {
  const c = cells.find((x) => x.id === cellId)
  if (!c || !policy) return { allowed: false, reason: 'NO_DATA', detail: 'No cell/policy data' }

  const nextEnabled = !Boolean(c.bal)
  if (!nextEnabled) return { allowed: true, reason: null, detail: '' }

  const t = c.t ?? 0
  if (t > policy.temp_limit_c) {
    return {
      allowed: false,
      reason: 'TEMP_LIMIT',
      detail: `Cell temp ${Number(t).toFixed(1)}°C > ${policy.temp_limit_c}°C`,
    }
  }

  const v = c.v ?? 0
  const deltaMv = Math.abs((v - packMeanV) * 1000)
  if (deltaMv < policy.min_delta_mv) {
    return {
      allowed: false,
      reason: 'DELTA_TOO_SMALL',
      detail: `|V - mean| = ${deltaMv.toFixed(1)}mV < ${policy.min_delta_mv}mV`,
    }
  }

  const activeCount = cells.filter((x) => x.bal).length
  if (activeCount >= policy.max_active) {
    return {
      allowed: false,
      reason: 'MAX_ACTIVE',
      detail: `Active balancing cells (${activeCount}) >= limit (${policy.max_active})`,
    }
  }

  return { allowed: true, reason: null, detail: '' }
}

export function PackOverviewPage() {
  const nav = useNavigate()
  const vehicleId = DEFAULT_VEHICLE_ID
  const { data, loading, error } = useDashboardInit(vehicleId)
  const { pack, cells, alarms, connected, stale, streaming, start, stop, toggleBalance } =
    useBmsStream()
  const { toasts, push } = useToast()

  const [policy, setPolicy] = useState<BalancePolicy | null>(null)
  const [selectedCellId, setSelectedCellId] = useState<number | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingCellId, setPendingCellId] = useState<number | null>(null)

  useEffect(() => {
    fetchBalancePolicy().then(setPolicy).catch(() => setPolicy(null))
  }, [])

  const packFromRest = data?.pack ?? {}
  const cellsFromRest = data?.cells ?? []
  const learnings = data?.learnings ?? {}
  const alarmsFromRest = data?.alarms ?? { active: [], latched: [] }

  const mergedPack: DashboardResponse['pack'] = {
    ...packFromRest,
    voltage: pack?.pack_voltage ?? packFromRest.voltage,
    current: pack?.pack_current ?? packFromRest.current,
    soc: pack?.soc ?? packFromRest.soc,
    soh: pack?.soh ?? packFromRest.soh,
    pack_temp: pack?.pack_temp ?? packFromRest.pack_temp,
    ambient_temp: pack?.ambient_temp ?? packFromRest.ambient_temp,
    mode: pack?.mode ?? packFromRest.mode,
    ts: pack?.ts ?? packFromRest.ts,
  }

  const mergedCells: DashboardResponse['cells'] =
    cells.length > 0
      ? cells.map((c) => ({
          id: c.id,
          v: c.v,
          t: c.t,
          i: c.i,
          soc: c.soc,
          soh: c.soh,
          bal: c.bal,
          alarm: c.alarm,
          del_est: 100,
          chg_est: 100,
        }))
      : cellsFromRest

  const packMeanV = useMemo(() => {
    if (!mergedCells.length) return 0
    const vs = mergedCells.map((c) => c.v).filter((v): v is number => v != null && !Number.isNaN(v))
    if (!vs.length) return 0
    return vs.reduce((s, v) => s + v, 0) / vs.length
  }, [mergedCells])

  const eligibility = useMemo(() => {
    if (pendingCellId == null) return { allowed: false, reason: 'NO_DATA' as const, detail: '' }
    return evaluateBalanceEligibility(pendingCellId, mergedCells, policy, packMeanV)
  }, [pendingCellId, mergedCells, policy, packMeanV])

  const mergedAlarms =
    alarms.active.length > 0 || alarms.latched.length > 0 ? alarms : alarmsFromRest

  const selectedCell =
    selectedCellId != null ? mergedCells.find((c) => c.id === selectedCellId) ?? null : null

  const timestamp = mergedPack.ts
    ? new Date(mergedPack.ts).toLocaleString()
    : new Date().toLocaleString()

  const onPlot = () =>
    nav(
      `/dashboard/plot?vehicle_id=${encodeURIComponent(vehicleId)}&metric=pack_voltage&window=600`
    )

  function onCellClick(cellId: number) {
    setSelectedCellId(cellId)
    setPendingCellId(cellId)
    setConfirmOpen(true)
  }

  async function confirmToggle() {
    if (pendingCellId == null) return

    if (!eligibility.allowed) {
      push(`Denied: ${eligibility.detail}`, 'error')
      return
    }

    const target = mergedCells.find((c) => c.id === pendingCellId)
    const next = !Boolean(target?.bal)
    setConfirmOpen(false)
    const cellStr = String(pendingCellId).padStart(2, '0')
    push(`Balancing ${next ? 'ON' : 'OFF'} request → Cell ${cellStr}`, 'info')

    try {
      const resp = await toggleBalance(pendingCellId)
      push(`Applied: Cell ${cellStr} balancing ${resp.enabled ? 'ON' : 'OFF'}`, 'success')
    } catch (e) {
      push(e instanceof Error ? e.message : 'Balance API error', 'error')
    }
    setPendingCellId(null)
  }

  if (loading && !data) {
    return (
      <ShellLayout
        title="⚡ MBM165-P50-B GUI - Battery Management System"
        timestamp={new Date().toLocaleString()}
        connected={connected}
        stale={stale}
        streaming={streaming}
        onStart={start}
        onStop={stop}
        onPlot={onPlot}
      >
        <div className="panel-header">Pack Real Time Status</div>
        <div style={{ padding: 16 }}>Loading...</div>
      </ShellLayout>
    )
  }

  if (error && !data) {
    return (
      <ShellLayout
        title="⚡ MBM165-P50-B GUI - Battery Management System"
        timestamp={new Date().toLocaleString()}
        connected={connected}
        stale={stale}
        streaming={streaming}
        onStart={start}
        onStop={stop}
        onPlot={onPlot}
      >
        <div className="panel-header">Pack Real Time Status</div>
        <div style={{ padding: 16, color: '#c62828' }}>{error}</div>
      </ShellLayout>
    )
  }

  return (
    <>
      <ShellLayout
        title="⚡ MBM165-P50-B GUI - Battery Management System"
        timestamp={timestamp}
        connected={connected}
        stale={stale}
        streaming={streaming}
        onStart={start}
        onStop={stop}
        onPlot={onPlot}
        right={
          <>
            <SelectedCellPanel vehicleId={vehicleId} cell={selectedCell} />
            <div style={{ height: 10 }} />
            <LearningsPanel learnings={learnings} />
            <AlarmsPanel alarms={mergedAlarms} />
          </>
        }
      >
        <div className="panel-header">Pack Real Time Status</div>

        <PackMetricsGrid pack={mergedPack} />
        <SocSection pack={mergedPack} />

        <CellGrid cells={mergedCells} onCellClick={onCellClick} />
        <CellsTable cells={mergedCells} />

        <button className="btn btn-start" type="button" style={{ width: 200, margin: '0 auto', display: 'block' }}>
          Reset Fuel Gauge
        </button>
      </ShellLayout>

      <Modal
        open={confirmOpen}
        title="⚙ Control Confirmation"
        onClose={() => {
          setConfirmOpen(false)
          setPendingCellId(null)
        }}
        footer={
          <>
            <button
              type="button"
              className="btn"
              onClick={() => {
                setConfirmOpen(false)
                setPendingCellId(null)
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-start"
              onClick={confirmToggle}
              disabled={!eligibility.allowed}
            >
              Confirm
            </button>
          </>
        }
      >
        <div style={{ lineHeight: 1.6 }}>
          Toggle balancing for{' '}
          <b>Cell {pendingCellId != null ? String(pendingCellId).padStart(2, '0') : '--'}</b>
          <div
            style={{
              marginTop: 10,
              padding: 10,
              border: '1px solid #eee',
              borderRadius: 6,
              background: '#fafafa',
            }}
          >
            <div style={{ fontWeight: 800, marginBottom: 6 }}>Eligibility</div>
            <div style={{ fontSize: 12 }}>
              {eligibility.allowed ? '✅ Allowed' : `❌ Denied: ${eligibility.detail}`}
            </div>
            {policy != null && (
              <div style={{ fontSize: 11, color: '#666', marginTop: 6 }}>
                Policy: max_active={policy.max_active}, min_delta_mv={policy.min_delta_mv},
                temp_limit_c={policy.temp_limit_c}
              </div>
            )}
          </div>
        </div>
      </Modal>

      <ToastStack toasts={toasts} />
    </>
  )
}
