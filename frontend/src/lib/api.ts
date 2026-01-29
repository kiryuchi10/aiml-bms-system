export type HealthResponse = { status: string; app: string; env: string }

export type ResultCell = {
  dataset_key: string
  model_key: string
  display: string
  error_value?: number | null
  error_mean?: number | null
  error_std?: number | null
  is_overflow: boolean
  overflow_threshold?: number | null
}

export type ComparisonTableResponse = {
  run_id: number
  datasets: string[]
  models: string[]
  cells: ResultCell[]
}

async function http<T>(path: string): Promise<T> {
  const res = await fetch(path)
  if (!res.ok) throw new Error(await res.text())
  return (await res.json()) as T
}

export function getHealth() {
  return http<HealthResponse>('/api/health')
}

export function getReferenceResults() {
  return http<ComparisonTableResponse>('/api/results/reference')
}

