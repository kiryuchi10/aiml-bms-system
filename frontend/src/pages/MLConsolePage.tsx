/**
 * ML Console: dataset list, train (async), runs list, run detail. Polling for run status.
 */

import { useCallback, useEffect, useState } from 'react'
import {
  getMlDatasets,
  getMlRuns,
  getMlRun,
  postMlTrain,
  type MlDataset,
  type MlRunSummary,
  type MlRunDetail,
} from '../services/apiV1'
import '../styles/BMSDashboard.css'

export function MLConsolePage() {
  const [datasets, setDatasets] = useState<MlDataset[]>([])
  const [runs, setRuns] = useState<MlRunSummary[]>([])
  const [selectedRunId, setSelectedRunId] = useState<number | null>(null)
  const [runDetail, setRunDetail] = useState<MlRunDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [trainBusy, setTrainBusy] = useState(false)

  const loadDatasets = useCallback(() => {
    getMlDatasets()
      .then((r) => setDatasets(r.datasets ?? []))
      .catch(() => setDatasets([]))
  }, [])
  const loadRuns = useCallback(() => {
    getMlRuns(true)
      .then((r) => setRuns(Array.isArray(r) ? r : []))
      .catch(() => setRuns([]))
  }, [])

  useEffect(() => {
    loadDatasets()
    loadRuns()
    setLoading(false)
  }, [loadDatasets, loadRuns])

  useEffect(() => {
    if (selectedRunId == null) {
      setRunDetail(null)
      return
    }
    getMlRun(selectedRunId)
      .then(setRunDetail)
      .catch(() => setRunDetail(null))
  }, [selectedRunId])

  const pollRuns = useCallback(() => {
    loadRuns()
  }, [loadRuns])
  useEffect(() => {
    const id = setInterval(pollRuns, 5000)
    return () => clearInterval(id)
  }, [pollRuns])

  const handleTrain = useCallback(async () => {
    setTrainBusy(true)
    setError(null)
    try {
      await postMlTrain({ dataset_key: 'default', model_key: 'mlp', epochs: 5 }, true)
      loadRuns()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Train failed')
    } finally {
      setTrainBusy(false)
    }
  }, [loadRuns])

  if (loading) return <div className="bms-dashboard page-body-inner"><div className="loading-state">Loading…</div></div>

  return (
    <div className="bms-dashboard page-body-inner">
      <h1 className="page-title">ML Console</h1>
      {error && <div className="error-state">{error}</div>}

      <section style={{ marginBottom: 24 }}>
        <h2 className="section-label">ML-ready datasets (feature_cell)</h2>
        {datasets.length > 0 ? (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {datasets.map((d, i) => (
              <li key={i} style={{ padding: 8, background: '#f8f8f8', marginBottom: 4, borderRadius: 4 }}>
                vehicle_id={d.vehicle_id} window_sec={d.window_sec} rows={d.row_count}
              </li>
            ))}
          </ul>
        ) : (
          <div className="empty-state">No feature_cell data. Build feature pipeline first.</div>
        )}
      </section>

      <section style={{ marginBottom: 24 }}>
        <button type="button" className="control-btn start" onClick={handleTrain} disabled={trainBusy}>
          {trainBusy ? 'Enqueuing…' : 'Enqueue training (async)'}
        </button>
      </section>

      <section>
        <h2 className="section-label">Runs (polling every 5s)</h2>
        {runs.length > 0 ? (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {runs.map((r) => (
              <li
                key={r.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedRunId(r.id)}
                onKeyDown={(e) => e.key === 'Enter' && setSelectedRunId(r.id)}
                style={{
                  padding: 10,
                  marginBottom: 4,
                  background: selectedRunId === r.id ? '#e3f2fd' : '#f5f5f5',
                  borderRadius: 4,
                  cursor: 'pointer',
                }}
              >
                #{r.id} {r.run_name ?? r.dataset_name} — {r.model_name} — {r.status}
              </li>
            ))}
          </ul>
        ) : (
          <div className="empty-state">No runs yet</div>
        )}
        {runDetail && (
          <div style={{ marginTop: 16, padding: 16, background: '#f8f8f8', borderRadius: 6 }}>
            <h3>Run #{runDetail.id}</h3>
            <pre style={{ fontSize: 12 }}>{JSON.stringify(runDetail, null, 2)}</pre>
          </div>
        )}
      </section>
    </div>
  )
}
