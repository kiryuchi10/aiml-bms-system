/**
 * Fetch wrapper: Bearer token from localStorage in Authorization header.
 */
import { API_BASE } from "./endpoints";

export async function apiGet(path, token) {
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error(`GET ${path} -> ${res.status}`);
  return res.json();
}

export async function apiPost(path, token, body) {
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body != null ? { "Content-Type": "application/json" } : {}),
    },
    body: body != null ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`POST ${path} -> ${res.status}`);
  return res.json();
}
