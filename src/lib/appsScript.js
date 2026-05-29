/**
 * appsScript.js
 * Fetch wrapper for the Google Apps Script Web App endpoint.
 *
 * Configure in .env.local:
 *   VITE_GAS_URL   = https://script.google.com/macros/s/<ID>/exec
 *   VITE_GAS_TOKEN = your-shared-secret-token
 */

const BASE_URL = import.meta.env.VITE_GAS_URL   || ''
const TOKEN    = import.meta.env.VITE_GAS_TOKEN  || ''

/**
 * gasRequest
 * @param {'GET'|'POST'} method
 * @param {object}       params  — query params (GET) or body payload (POST)
 */
export async function gasRequest(method, params = {}) {
  if (!BASE_URL) {
    throw new Error(
      'VITE_GAS_URL is not set. Add it to .env.local and restart the dev server.'
    )
  }

  let url, options

  if (method === 'GET') {
    const qs = new URLSearchParams({ ...params, token: TOKEN }).toString()
    url     = `${BASE_URL}?${qs}`
    options = { method: 'GET' }
  } else {
    url     = `${BASE_URL}?token=${encodeURIComponent(TOKEN)}`
    options = {
      method:  'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body:    JSON.stringify(params),
    }
  }

  const controller = new AbortController()
  const timer      = setTimeout(() => controller.abort(), 15_000)

  try {
    const res = await fetch(url, { ...options, signal: controller.signal })
    clearTimeout(timer)
    if (!res.ok) throw new Error(`HTTP ${res.status} from Apps Script`)
    const data = await res.json()
    if (data.error) throw new Error(data.error)
    return data
  } catch (err) {
    clearTimeout(timer)
    if (err.name === 'AbortError') throw new Error('Request timed out (15 s)')
    throw err
  }
}
