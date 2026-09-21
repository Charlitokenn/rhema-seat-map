/**
 * ============================================================
 * Clerk session token verifier — apps-script/ClerkAuth.gs
 *
 * Verifies a Clerk RS256 session token with no Clerk secret key:
 * fetches the issuer's public keys (JWKS), checks the RSA
 * signature by hand (BigInt modular exponentiation, V8 runtime),
 * then checks the claims spec 0001 requires.
 *
 * Written as small pure functions that take the digest, the
 * clock and the key lookup as arguments, so the hard part
 * (parsing, signature check, claim checks) runs under Node's
 * built in test runner with no Apps Script involved — see
 * ClerkAuth.test.js. Only the small adapter functions at the
 * bottom touch Apps Script services (Utilities, UrlFetchApp,
 * CacheService, PropertiesService).
 *
 * Public entry points used by Code.gs:
 *   requireMember_(authToken)  → verified caller {id,name,email,role,orgId,sessionId}
 *                                 or throws Error with .code/.reason/.userId
 *
 * Everything else here is exported on the ClerkAuth object so it
 * can be required() from Node for tests.
 * ============================================================
 */

// ── Base64url + byte helpers (pure) ─────────────────────────────────────────

var BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

function base64UrlDecode(input) {
  var str = String(input == null ? '' : input).replace(/-/g, '+').replace(/_/g, '/')
  while (str.length % 4) str += '='
  var bytes = []
  var buffer = 0
  var bits = 0
  for (var i = 0; i < str.length; i++) {
    var c = str.charAt(i)
    if (c === '=') break
    var index = BASE64_CHARS.indexOf(c)
    if (index === -1) throw new Error('bad_base64')
    buffer = (buffer << 6) | index
    bits += 6
    if (bits >= 8) {
      bits -= 8
      bytes.push((buffer >> bits) & 0xff)
    }
  }
  return bytes
}

function bytesToUtf8(bytes) {
  var result = ''
  var i = 0
  while (i < bytes.length) {
    var b0 = bytes[i++]
    if (b0 < 0x80) {
      result += String.fromCharCode(b0)
    } else if (b0 >= 0xc0 && b0 < 0xe0) {
      var b1 = bytes[i++]
      result += String.fromCharCode(((b0 & 0x1f) << 6) | (b1 & 0x3f))
    } else if (b0 >= 0xe0 && b0 < 0xf0) {
      var b1b = bytes[i++]; var b2 = bytes[i++]
      result += String.fromCharCode(((b0 & 0x0f) << 12) | ((b1b & 0x3f) << 6) | (b2 & 0x3f))
    } else {
      var b1c = bytes[i++]; var b2c = bytes[i++]; var b3 = bytes[i++]
      var codepoint = ((b0 & 0x07) << 18) | ((b1c & 0x3f) << 12) | ((b2c & 0x3f) << 6) | (b3 & 0x3f)
      codepoint -= 0x10000
      result += String.fromCharCode(0xd800 + (codepoint >> 10), 0xdc00 + (codepoint & 0x3ff))
    }
  }
  return result
}

function stringToAsciiBytes(str) {
  var bytes = []
  for (var i = 0; i < str.length; i++) bytes.push(str.charCodeAt(i) & 0xff)
  return bytes
}

function bytesToBigInt(bytes) {
  var result = 0n
  for (var i = 0; i < bytes.length; i++) {
    result = (result << 8n) | BigInt(bytes[i])
  }
  return result
}

function bigIntToBytes(value, length) {
  var bytes = []
  var v = value
  for (var i = 0; i < length; i++) {
    bytes.unshift(Number(v & 0xffn))
    v = v >> 8n
  }
  return bytes
}

function modPow(base, exponent, modulus) {
  if (modulus === 1n) return 0n
  var result = 1n
  var b = base % modulus
  var e = exponent
  while (e > 0n) {
    if (e % 2n === 1n) result = (result * b) % modulus
    e = e / 2n
    b = (b * b) % modulus
  }
  return result
}

function constantTimeEqual(a, b) {
  if (a.length !== b.length) return false
  var diff = 0
  for (var i = 0; i < a.length; i++) diff |= (a[i] ^ b[i])
  return diff === 0
}

function stripTrailingSlash(s) {
  return typeof s === 'string' ? s.replace(/\/+$/, '') : s
}

// ── RSASSA-PKCS1-v1_5 / SHA-256 signature check (pure) ──────────────────────
// DigestInfo prefix for SHA-256 (RFC 8017), 19 bytes, followed by the 32 byte hash.
var SHA256_DIGEST_INFO = [0x30, 0x31, 0x30, 0x0d, 0x06, 0x09, 0x60, 0x86, 0x48, 0x01, 0x65, 0x03, 0x04, 0x02, 0x01, 0x05, 0x00, 0x04, 0x20]

function buildExpectedEmsaBlock(digestBytes, modulusByteLength) {
  var t = SHA256_DIGEST_INFO.concat(digestBytes) // 51 bytes for SHA-256
  var psLength = modulusByteLength - t.length - 3
  if (psLength < 8) throw new Error('modulus_too_small')
  var block = [0x00, 0x01]
  for (var i = 0; i < psLength; i++) block.push(0xff)
  block.push(0x00)
  return block.concat(t)
}

/**
 * verifyRS256Signature — pure. digestBytes is the SHA-256 digest of the
 * signing input (already computed by the caller); jwk is {n, e} as base64url
 * strings, exactly as Clerk's JWKS returns them.
 */
function verifyRS256Signature(digestBytes, signatureBytes, jwk) {
  if (!jwk || !jwk.n || !jwk.e) return false
  var modulusBytes = base64UrlDecode(jwk.n)
  if (modulusBytes.length && modulusBytes[0] === 0) modulusBytes = modulusBytes.slice(1) // strip sign byte
  var exponentBytes = base64UrlDecode(jwk.e)
  var n = bytesToBigInt(modulusBytes)
  var e = bytesToBigInt(exponentBytes)
  var s = bytesToBigInt(signatureBytes)
  if (n === 0n || s >= n) return false
  var m = modPow(s, e, n)
  var expected
  try {
    expected = buildExpectedEmsaBlock(digestBytes, modulusBytes.length)
  } catch (err) {
    return false
  }
  var actual = bigIntToBytes(m, modulusBytes.length)
  return constantTimeEqual(actual, expected)
}

// ── JWT structure (pure) ─────────────────────────────────────────────────────

function parseJwtParts(token) {
  if (typeof token !== 'string' || !token) return { error: 'missing' }
  var parts = token.split('.')
  if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) return { error: 'malformed' }
  var header, payload, signatureBytes
  try {
    header = JSON.parse(bytesToUtf8(base64UrlDecode(parts[0])))
    payload = JSON.parse(bytesToUtf8(base64UrlDecode(parts[1])))
    signatureBytes = base64UrlDecode(parts[2])
  } catch (err) {
    return { error: 'malformed' }
  }
  if (!header || typeof header !== 'object' || !payload || typeof payload !== 'object' || !signatureBytes.length) {
    return { error: 'malformed' }
  }
  return {
    header: header,
    payload: payload,
    signingInput: parts[0] + '.' + parts[1],
    signatureBytes: signatureBytes
  }
}

// ── Claim checks (pure) — spec 0001, "Claims checked" ───────────────────────

function checkClaims(header, payload, settings, nowMs) {
  if (!header || header.alg !== 'RS256') return { ok: false, reason: 'malformed' }

  var issuer = stripTrailingSlash(payload.iss)
  var expectedIssuer = stripTrailingSlash(settings.issuer)
  if (!issuer || !expectedIssuer || issuer !== expectedIssuer) {
    return { ok: false, reason: 'wrong_issuer' }
  }

  var skewMs = 5000
  if (typeof payload.nbf === 'number' && (payload.nbf * 1000) > (nowMs + skewMs)) {
    return { ok: false, reason: 'not_yet_valid' }
  }
  if (typeof payload.exp !== 'number' || (payload.exp * 1000) <= nowMs) {
    return { ok: false, reason: 'expired' }
  }

  var azp = payload.azp
  var authorizedParties = settings.authorizedParties || []
  if (!azp || authorizedParties.indexOf(azp) === -1) {
    return { ok: false, reason: 'wrong_party' }
  }

  var org = payload.o
  if (!org || !org.id) return { ok: false, reason: 'no_org' }
  if (!settings.orgId || org.id !== settings.orgId) return { ok: false, reason: 'wrong_org' }

  if (payload.sts === 'pending') return { ok: false, reason: 'pending' }

  var role = org.rol
  if (role !== 'admin' && role !== 'member') return { ok: false, reason: 'no_org' }

  return {
    ok: true,
    claims: {
      id: payload.sub,
      name: (payload.name && String(payload.name).trim()) || 'Unnamed member',
      email: payload.email || null,
      role: role,
      orgId: org.id,
      sessionId: payload.sid || null
    }
  }
}

// Maps a denial reason to the API surface's error code (spec's `me` action table).
var REASON_TO_CODE = {
  missing: 'unauthenticated',
  malformed: 'unauthenticated',
  bad_signature: 'unauthenticated',
  expired: 'unauthenticated',
  not_yet_valid: 'unauthenticated',
  wrong_issuer: 'unauthenticated',
  unknown_key: 'unauthenticated',
  wrong_party: 'forbidden',
  no_org: 'forbidden',
  wrong_org: 'forbidden',
  pending: 'forbidden',
  keys_unavailable: 'unavailable'
}

/**
 * verifyToken — the orchestrator, still pure: opts.computeDigest(bytes) and
 * opts.lookupKey(kid) are injected, so this same function runs in Apps
 * Script (real network + crypto) and in Node tests (fakes).
 *
 * Returns { ok:true, claims } or { ok:false, code, reason, message, userId }.
 */
function verifyToken(token, settings, opts) {
  opts = opts || {}
  var now = typeof opts.now === 'number' ? opts.now : Date.now()
  settings = settings || {}

  if (!token) {
    return { ok: false, code: 'unauthenticated', reason: 'missing', message: 'Missing authToken' }
  }

  var parsed = parseJwtParts(token)
  if (parsed.error) {
    return { ok: false, code: 'unauthenticated', reason: parsed.error, message: 'Malformed token' }
  }

  var kid = parsed.header.kid
  var jwk
  try {
    jwk = opts.lookupKey ? opts.lookupKey(kid) : null
  } catch (err) {
    return { ok: false, code: 'unavailable', reason: 'keys_unavailable', message: 'Could not fetch signing keys' }
  }
  if (!jwk) {
    return { ok: false, code: 'unauthenticated', reason: 'unknown_key', message: 'Unknown signing key' }
  }

  var digestBytes
  try {
    digestBytes = opts.computeDigest(stringToAsciiBytes(parsed.signingInput))
  } catch (err) {
    return { ok: false, code: 'unavailable', reason: 'keys_unavailable', message: 'Digest computation failed' }
  }

  var signatureOk = false
  try {
    signatureOk = verifyRS256Signature(digestBytes, parsed.signatureBytes, jwk)
  } catch (err) {
    signatureOk = false
  }
  if (!signatureOk) {
    return { ok: false, code: 'unauthenticated', reason: 'bad_signature', message: 'Bad token signature', userId: parsed.payload.sub }
  }

  var claimResult = checkClaims(parsed.header, parsed.payload, settings, now)
  if (!claimResult.ok) {
    return {
      ok: false,
      code: REASON_TO_CODE[claimResult.reason] || 'unauthenticated',
      reason: claimResult.reason,
      message: 'Token rejected: ' + claimResult.reason,
      userId: parsed.payload.sub
    }
  }

  return { ok: true, claims: claimResult.claims }
}

// ── Exported surface (pure functions, safe under Node) ──────────────────────

var ClerkAuth = {
  base64UrlDecode: base64UrlDecode,
  bytesToUtf8: bytesToUtf8,
  bytesToBigInt: bytesToBigInt,
  bigIntToBytes: bigIntToBytes,
  modPow: modPow,
  stripTrailingSlash: stripTrailingSlash,
  verifyRS256Signature: verifyRS256Signature,
  parseJwtParts: parseJwtParts,
  checkClaims: checkClaims,
  verifyToken: verifyToken,
  REASON_TO_CODE: REASON_TO_CODE
}

// ═══════════════════════════════════════════════════════════════════════════
// Apps Script only below this line: Utilities / UrlFetchApp / CacheService /
// PropertiesService adapters, wired to the pure functions above. Node never
// calls these (tests inject their own computeDigest/lookupKey).
// ═══════════════════════════════════════════════════════════════════════════

var CLERK_JWKS_CACHE_KEY = 'clerk_jwks'
var CLERK_JWKS_REFETCH_KEY = 'clerk_jwks_refetch_at'
var CLERK_JWKS_CACHE_TTL_SECONDS = 6 * 60 * 60 // 6 hours
var CLERK_JWKS_REFETCH_THROTTLE_MS = 60 * 1000 // once a minute

function clerkComputeDigestGas_(bytes) {
  var signedBytes = bytes.map(function (b) { return b > 127 ? b - 256 : b })
  var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, signedBytes)
  return digest.map(function (b) { return b < 0 ? b + 256 : b })
}

function clerkFindKeyInJwks_(jwks, kid) {
  if (!jwks || !jwks.keys) return null
  for (var i = 0; i < jwks.keys.length; i++) {
    if (jwks.keys[i].kid === kid) return jwks.keys[i]
  }
  return null
}

function clerkFetchJwksFromNetwork_(issuer) {
  var url = stripTrailingSlash(issuer) + '/.well-known/jwks.json'
  var response = UrlFetchApp.fetch(url, { muteHttpExceptions: true })
  if (response.getResponseCode() !== 200) {
    throw new Error('jwks_fetch_failed: HTTP ' + response.getResponseCode())
  }
  return JSON.parse(response.getContentText())
}

/**
 * clerkLookupKeyGas_ — cache up to 6h; on an unknown kid, refetch once,
 * throttled to at most once a minute. If the network fetch fails, fall
 * back to whatever is cached (possibly still missing the key); with
 * nothing cached at all, throw so verifyToken reports `unavailable`.
 */
function clerkLookupKeyGas_(kid, issuer) {
  var cache = CacheService.getScriptCache()
  var cachedRaw = cache.get(CLERK_JWKS_CACHE_KEY)
  var jwks = cachedRaw ? JSON.parse(cachedRaw) : null

  if (jwks) {
    var match = clerkFindKeyInJwks_(jwks, kid)
    if (match) return match
  }

  var now = Date.now()
  var lastRefetch = Number(cache.get(CLERK_JWKS_REFETCH_KEY) || 0)
  if (jwks && (now - lastRefetch) < CLERK_JWKS_REFETCH_THROTTLE_MS) {
    return null // refetched recently and the key still wasn't there
  }
  cache.put(CLERK_JWKS_REFETCH_KEY, String(now), Math.ceil(CLERK_JWKS_REFETCH_THROTTLE_MS / 1000) + 5)

  var fresh
  try {
    fresh = clerkFetchJwksFromNetwork_(issuer)
  } catch (err) {
    if (jwks) return null // stale cache exists; treat as unknown key, not unavailable
    throw err // nothing cached at all
  }

  cache.put(CLERK_JWKS_CACHE_KEY, JSON.stringify(fresh), CLERK_JWKS_CACHE_TTL_SECONDS)
  return clerkFindKeyInJwks_(fresh, kid)
}

/**
 * requireMember_ — called from Code.gs for every guarded action.
 * Returns the verified caller {id,name,email,role,orgId,sessionId} or
 * throws an Error with .code ('unauthenticated'|'forbidden'|'unavailable'),
 * .reason (one of ClerkAuth.REASON_TO_CODE's keys) and .userId ('unknown'
 * unless the signature verified).
 */
function requireMember_(authToken) {
  var props = PropertiesService.getScriptProperties()
  var issuer = props.getProperty('CLERK_ISSUER')
  var orgId = props.getProperty('CLERK_ORG_ID')
  var partiesRaw = props.getProperty('CLERK_AUTHORIZED_PARTIES') || ''
  var authorizedParties = partiesRaw.split(',')
    .map(function (s) { return s.trim() })
    .filter(function (s) { return s })

  var settings = { issuer: issuer, orgId: orgId, authorizedParties: authorizedParties }

  var result = verifyToken(authToken, settings, {
    now: Date.now(),
    computeDigest: clerkComputeDigestGas_,
    lookupKey: function (kid) { return clerkLookupKeyGas_(kid, issuer) }
  })

  if (!result.ok) {
    var err = new Error(result.message)
    err.code = result.code
    err.reason = result.reason
    err.userId = result.userId || 'unknown'
    throw err
  }

  return result.claims
}

// Node test runner support only — Apps Script ignores `module`.
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ClerkAuth
}
