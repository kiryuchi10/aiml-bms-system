/**
 * Base API client: apiGet with VITE_API_BASE.
 * Use for dashboard/telemetry endpoints that need a single fetch wrapper.
 */

const API_BASE =
  (import.meta as unknown as { env?: { VITE_API_BASE?: string } }).env?.VITE_API_BASE ?? ''

function resolvePath(path: string): string {
  if (path.startsWith('http')) return path
  if (API_BASE) {
    const base = API_BASE.replace(/\/$/, '')
    const suffix = path.startsWith('/') ? path.slice(1) : path
    return `${base}/${suffix.replace(/^\//, '')}`
  }
  return new URL(path, window.location.origin).href
}

export async function apiGet<T>(path: string): Promise<T> {
  const url = path.startsWith('http') ? path : resolvePath(path.startsWith('/') ? path : `/${path}`)
  const res = await fetch(url.toString(), { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(await res.text())
  return res.json() as Promise<T>
}
