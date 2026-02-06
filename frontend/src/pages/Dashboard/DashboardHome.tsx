/**
 * Dashboard Home — 12-col layout (보일러플레이트).
 * TopBar/SideBar are provided by AppShell; this is main content only.
 * API: dashboardApi.getOverview(), getCellTable({ limit: 16 }).
 */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import PackOverviewTiles from '../../components/dashboard/PackOverviewTiles'
import SocGaugeCard from '../../components/dashboard/SocGaugeCard'
import PackInfoCards from '../../components/dashboard/PackInfoCards'
import WorstCellCard from '../../components/dashboard/WorstCellCard'
import ActiveAlarmsMiniTable from '../../components/dashboard/ActiveAlarmsMiniTable'
import CellTable from '../../components/dashboard/CellTable'
import LearningsCard from '../../components/dashboard/LearningsCard'
import AlarmsGridCard from '../../components/dashboard/AlarmsGridCard'

import { getOverview, getCellTable, type OverviewResponse, type CellTableRow } from '../../services/dashboardApi'

import '../../styles/dashboard.css'
import '../../styles/BMSDashboard.css'

export type StatusLevel = 'normal' | 'warning' | 'fault'

export default function DashboardHome() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [overview, setOverview] = useState<OverviewResponse | null>(null)
  const [cellRows, setCellRows] = useState<CellTableRow[]>([])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setLoading(true)
        setError(null)
        const [ov, cells] = await Promise.all([
          getOverview(),
          getCellTable({ limit: 16 }),
        ])
        if (!mounted) return
        setOverview(ov)
        setCellRows(cells?.rows ?? [])
      } catch (e: unknown) {
        if (!mounted) return
        setError(e instanceof Error ? e.message : 'Failed to load dashboard')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  const pack = overview?.pack
  const worstCell = overview?.worst_cell
  const learnings = overview?.learnings ?? []
  const activeAlarms = overview?.active_alarms ?? []
  const alarmCounts = overview?.alarm_counts ?? { active: 0, latched: 0 }

  if (loading) {
    return (
      <div className="page-body-inner" style={{ padding: 24 }}>
        Loading Dashboard…
      </div>
    )
  }

  if (error) {
    return (
      <div className="page-body-inner" style={{ padding: 24 }}>
        <h2>Dashboard Error</h2>
        <p style={{ opacity: 0.8 }}>{error}</p>
      </div>
    )
  }

  return (
    <div className="dashboard-home-boilerplate">
      {/* Row1: Pack Summary Bar */}
      <section className="row row-full">
        <PackOverviewTiles pack={pack} />
      </section>

      {/* Row2: (col-8) main cards + (col-4) alarms mini table */}
      <section className="row row-2col">
        <div className="col col-8 stack">
          <div className="grid2">
            <SocGaugeCard
              soc={pack?.soc}
              unusableSoc={undefined}
              remainingTime={undefined}
              toFull={undefined}
            />
            <WorstCellCard worstCell={worstCell} />
          </div>

          <PackInfoCards
            soh={pack?.soh}
            remainingTime={undefined}
            ccCharge={undefined}
            toFull={undefined}
          />

          <CellTable
            rows={cellRows}
            onRowClick={(row) => navigate(`/bms/cells?cellId=${row.cell_id}`)}
          />
        </div>

        <div className="col col-4 stack">
          <ActiveAlarmsMiniTable alarms={activeAlarms} onRowClick={() => navigate('/bms/alarms')} />
          <LearningsCard items={learnings} />
          <AlarmsGridCard counts={alarmCounts} onFilter={() => navigate('/bms/alarms')} />
        </div>
      </section>
    </div>
  )
}
