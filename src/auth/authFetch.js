import { gasRequest } from '@/lib/appsScript.js'

/**
 * authFetch — POST a Clerk-guarded action to the Apps Script backend.
 * Fetches a fresh token right before the call (Clerk's getToken() handles
 * refreshing under the hood), and sends it as `authToken` in the JSON body
 * per spec 0001 (POST only, token never in the URL).
 *
 * @param {() => Promise<string|null>} getToken — Clerk's useAuth().getToken
 * @param {string} action
 * @param {object} [params]
 * @returns {Promise<{ok:true,...}|{ok:false,error:string,code:string}>}
 *   Never throws for an ordinary denial — callers check `.ok` and `.code`.
 *   Can still throw for a real transport failure (offline, timeout, HTTP error).
 */
export async function authFetch(getToken, action, params = {}) {
  const authToken = await getToken()
  if (!authToken) {
    return { ok: false, error: 'Not signed in', code: 'unauthenticated' }
  }
  return gasRequest('POST', { ...params, action, authToken }, { throwOnError: false })
}
