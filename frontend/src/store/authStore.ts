/**
 * Auth store: token in localStorage, Bearer for API.
 * Do not commit secrets; use .env for API base.
 */
const TOKEN_KEY = 'token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string | null): void {
  if (token == null) localStorage.removeItem(TOKEN_KEY)
  else localStorage.setItem(TOKEN_KEY, token)
}

export function isAuthenticated(): boolean {
  return !!getToken()
}
