/**
 * api.ts — centralised fetch wrapper
 *
 * Every API call in the app goes through `apiFetch` instead of raw `fetch`.
 * If the backend returns 401 (token expired), it automatically:
 *   1. Calls /refresh with the stored refresh token
 *   2. Saves the new access token to Zustand
 *   3. Retries the original request once
 *   4. If refresh also fails → clears tokens so the user is sent back to login
 */

import { useStore } from './store'

const BASE = 'http://127.0.0.1:8888'

export async function apiFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const { accessToken, refreshToken, setAccessToken, logout } = useStore.getState()

  // Attach the current access token
  const headers = new Headers(options.headers)
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`)
  }
  headers.set('Content-Type', 'application/json')

  const response = await fetch(`${BASE}${path}`, { ...options, headers })

  // If not 401, just return the response as-is
  if (response.status !== 401) {
    return response
  }

  // ── 401 hit — try to refresh ──────────────────────────────────────
  if (!refreshToken) {
    logout()
    window.location.href = '/'
    return response
  }

  try {
    const refreshRes = await fetch(`${BASE}/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })

    if (!refreshRes.ok) throw new Error('Refresh failed')

    const { access_token } = await refreshRes.json()
    setAccessToken(access_token)

    // Retry the original request with the new token
    headers.set('Authorization', `Bearer ${access_token}`)
    return fetch(`${BASE}${path}`, { ...options, headers })

  } catch {
    // Refresh failed — log the user out
    logout()
    window.location.href = '/'
    return response
  }
}
