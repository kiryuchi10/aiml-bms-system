/**
 * Base API: fetch with optional Bearer token. Do not commit secrets; use .env.
 */
const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8000'

export async function apiGet<T>(path: string): Promise<T> {
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`
  const headers: HeadersInit = {}
  const token = localStorage.getItem('token')
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(url, { headers })
  if (!res.ok) throw new Error(await res.text())
  return res.json() as Promise<T>
}

/** Balance policy (safety limits). */
export type BalancePolicy = {
  max_active: number
  min_delta_mv: number
  temp_limit_c: number
}

/** GET /api/v1/balance/policy — balancing safety policy. */
export async function fetchBalancePolicy(): Promise<BalancePolicy> {
  const url = `${API_BASE}/api/v1/balance/policy`
  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(`Policy API failed: ${res.status}`)
  return res.json()
}

/** POST /api/v1/balance/set response (denial includes reason/detail). */
export type BalanceSetResponse = {
  ok: boolean
  cell_id: number
  enabled: boolean
  reason?: string
  detail?: string
}

/** POST /api/v1/balance/set — toggle cell balancing; server may deny with reason/detail. */
export async function postBalanceSet(params: {
  vehicle_id: string
  cell_id: number
  enabled: boolean
}): Promise<BalanceSetResponse> {
  const url = `${API_BASE}/api/v1/balance/set`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(params),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}
