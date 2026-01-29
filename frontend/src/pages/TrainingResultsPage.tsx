import { useEffect, useMemo, useState } from 'react'
import { ComparisonTableResponse, getReferenceResults } from '../lib/api'

function cellKey(model: string, dataset: string) {
  return `${model}__${dataset}`
}

export function TrainingResultsPage() {
  const [data, setData] = useState<ComparisonTableResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    getReferenceResults()
      .then((d) => !cancelled && setData(d))
      .catch((e: unknown) => !cancelled && setError(e instanceof Error ? e.message : String(e)))
    return () => {
      cancelled = true
    }
  }, [])

  const lookup = useMemo(() => {
    const map = new Map<string, string>()
    for (const c of data?.cells ?? []) {
      map.set(cellKey(c.model_key, c.dataset_key), c.display)
    }
    return map
  }, [data])

  return (
    <div className="panel">
      <div className="panelTitle">Training Results (Reference Table)</div>
      <div className="tableNote">
        For models sensitive to initialization, values are error mean across ten seeds with standard deviation as
        subscript (shown as <span className="mono">mean±std</span>).
      </div>

      {error && <div className="errorBox">Failed to load: {error}</div>}
      {!data && !error && <div className="placeholderBox">Loading reference results…</div>}

      {data && (
        <div className="tableWrap">
          <table className="resultTable">
            <thead>
              <tr>
                <th className="stickyCol">Models</th>
                {data.datasets.map((ds) => (
                  <th key={ds}>{ds}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.models.map((m) => (
                <tr key={m}>
                  <td className="stickyCol">{m}</td>
                  {data.datasets.map((ds) => (
                    <td key={ds} className="mono">
                      {lookup.get(cellKey(m, ds)) ?? ''}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

