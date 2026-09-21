/**
 * apps-script/ClerkAuth.test.js
 *
 * Node's built in test runner, no Apps Script involved:
 *   node --test apps-script/ClerkAuth.test.js
 *
 * Generates a real RSA keypair, signs real RS256 JWTs by hand (no jsonwebtoken
 * dependency, to match exactly what ClerkAuth.gs parses), and exercises
 * ClerkAuth.verifyToken against every case AC-11 lists.
 */

const test = require('node:test')
const assert = require('node:assert/strict')
const crypto = require('node:crypto')
const path = require('node:path')

const ClerkAuth = require(path.join(__dirname, 'ClerkAuth.gs'))

// ── Test fixtures: a real keypair, a real JWKS, real signing ────────────────

const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 })
const jwk = publicKey.export({ format: 'jwk' }) // { kty, n, e } — n/e are base64url, matches Clerk's JWKS shape
jwk.kid = 'test-key-1'

const otherKeyPair = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 })
const otherJwk = otherKeyPair.publicKey.export({ format: 'jwk' })
otherJwk.kid = 'test-key-1' // same kid, different key — simulates "wrong key"

const ISSUER = 'https://test-instance.clerk.accounts.dev'
const ORG_ID = 'org_test123'
const AUTHORIZED_PARTY = 'https://rhema-reporting.nkonoki-charles.workers.dev'

const SETTINGS = {
  issuer: ISSUER,
  orgId: ORG_ID,
  authorizedParties: [AUTHORIZED_PARTY, 'http://localhost:5173']
}

function base64UrlEncode(buffer) {
  return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64UrlEncodeJson(obj) {
  return base64UrlEncode(Buffer.from(JSON.stringify(obj), 'utf8'))
}

/** Signs a JWT with the given payload/header overrides using `signingKey` (defaults to the real private key). */
function makeToken(payloadOverrides, headerOverrides, signingKey) {
  const now = Math.floor(Date.now() / 1000)
  const header = Object.assign({ alg: 'RS256', typ: 'JWT', kid: 'test-key-1' }, headerOverrides)
  const payload = Object.assign({
    sub: 'user_abc123',
    iss: ISSUER,
    iat: now,
    nbf: now - 5,
    exp: now + 60,
    azp: AUTHORIZED_PARTY,
    sts: 'active',
    name: 'Jane Usher',
    email: 'jane@example.com',
    o: { id: ORG_ID, rol: 'member' }
  }, payloadOverrides)

  const signingInput = base64UrlEncodeJson(header) + '.' + base64UrlEncodeJson(payload)
  const signature = crypto.sign('RSA-SHA256', Buffer.from(signingInput, 'utf8'), {
    key: signingKey || privateKey,
    padding: crypto.constants.RSA_PKCS1_PADDING
  })
  return signingInput + '.' + base64UrlEncode(signature)
}

function computeDigest(bytes) {
  return Array.from(crypto.createHash('sha256').update(Buffer.from(bytes)).digest())
}

function lookupKey(kid) {
  if (kid !== jwk.kid) return null
  return jwk
}

function verify(token, overrides) {
  return ClerkAuth.verifyToken(token, SETTINGS, Object.assign({ computeDigest, lookupKey }, overrides))
}

// ── Happy path ───────────────────────────────────────────────────────────────

test('valid token verifies and returns the caller claims', () => {
  const token = makeToken({}, {})
  const result = verify(token)
  assert.equal(result.ok, true)
  assert.equal(result.claims.id, 'user_abc123')
  assert.equal(result.claims.name, 'Jane Usher')
  assert.equal(result.claims.email, 'jane@example.com')
  assert.equal(result.claims.role, 'member')
  assert.equal(result.claims.orgId, ORG_ID)
})

test('a blank name claim falls back to "Unnamed member"', () => {
  const token = makeToken({ name: '' })
  const result = verify(token)
  assert.equal(result.ok, true)
  assert.equal(result.claims.name, 'Unnamed member')
})

// ── AC-11 refusal cases ──────────────────────────────────────────────────────

test('missing token is refused as unauthenticated/missing', () => {
  const result = verify('')
  assert.equal(result.ok, false)
  assert.equal(result.code, 'unauthenticated')
  assert.equal(result.reason, 'missing')
})

test('malformed token (wrong number of segments) is refused', () => {
  const result = verify('not.a.valid.jwt.token')
  assert.equal(result.ok, false)
  assert.equal(result.reason, 'malformed')
})

test('malformed token (not base64/JSON) is refused', () => {
  const result = verify('###.###.###')
  assert.equal(result.ok, false)
  assert.equal(result.reason, 'malformed')
})

test('tampered payload (signature no longer matches) is refused as bad_signature', () => {
  const token = makeToken({})
  const [h, p, s] = token.split('.')
  const tamperedPayload = base64UrlEncodeJson(Object.assign(
    JSON.parse(Buffer.from(p.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8')),
    { o: { id: ORG_ID, rol: 'admin' } } // escalate role after signing
  ))
  const result = verify(`${h}.${tamperedPayload}.${s}`)
  assert.equal(result.ok, false)
  assert.equal(result.code, 'unauthenticated')
  assert.equal(result.reason, 'bad_signature')
})

test('wrong key (signed with a different private key than the published JWK) is refused', () => {
  const token = makeToken({}, {}, otherKeyPair.privateKey)
  const result = verify(token)
  assert.equal(result.ok, false)
  assert.equal(result.reason, 'bad_signature')
})

test('wrong algorithm (alg: none) is refused as malformed, never accepted', () => {
  const token = makeToken({}, { alg: 'none' })
  const result = verify(token)
  assert.equal(result.ok, false)
  assert.equal(result.reason, 'malformed')
})

test('wrong algorithm (alg: HS256) is refused as malformed', () => {
  const token = makeToken({}, { alg: 'HS256' })
  const result = verify(token)
  assert.equal(result.ok, false)
  assert.equal(result.reason, 'malformed')
})

test('expired token is refused', () => {
  const now = Math.floor(Date.now() / 1000)
  const token = makeToken({ exp: now - 30 })
  const result = verify(token)
  assert.equal(result.ok, false)
  assert.equal(result.code, 'unauthenticated')
  assert.equal(result.reason, 'expired')
})

test('not-yet-valid token (nbf in the future, beyond the 5s skew) is refused', () => {
  const now = Math.floor(Date.now() / 1000)
  const token = makeToken({ nbf: now + 30 })
  const result = verify(token)
  assert.equal(result.ok, false)
  assert.equal(result.reason, 'not_yet_valid')
})

test('nbf within the 5 second skew is accepted', () => {
  const now = Math.floor(Date.now() / 1000)
  const token = makeToken({ nbf: now + 3 })
  const result = verify(token)
  assert.equal(result.ok, true)
})

test('wrong issuer is refused', () => {
  const token = makeToken({ iss: 'https://someone-elses-app.clerk.accounts.dev' })
  const result = verify(token)
  assert.equal(result.ok, false)
  assert.equal(result.reason, 'wrong_issuer')
})

test('wrong organization is refused', () => {
  const token = makeToken({ o: { id: 'org_someone_else', rol: 'member' } })
  const result = verify(token)
  assert.equal(result.ok, false)
  assert.equal(result.code, 'forbidden')
  assert.equal(result.reason, 'wrong_org')
})

test('missing organization claim is refused as no_org', () => {
  const token = makeToken({ o: undefined })
  const result = verify(token)
  assert.equal(result.ok, false)
  assert.equal(result.code, 'forbidden')
  assert.equal(result.reason, 'no_org')
})

test('wrong app address (azp) is refused', () => {
  const token = makeToken({ azp: 'https://not-our-app.example.com' })
  const result = verify(token)
  assert.equal(result.ok, false)
  assert.equal(result.code, 'forbidden')
  assert.equal(result.reason, 'wrong_party')
})

test('a token with no app address (azp) is refused', () => {
  const token = makeToken({ azp: undefined })
  const result = verify(token)
  assert.equal(result.ok, false)
  assert.equal(result.reason, 'wrong_party')
})

test('a pending session (no active organization yet) is refused', () => {
  const token = makeToken({ sts: 'pending' })
  const result = verify(token)
  assert.equal(result.ok, false)
  assert.equal(result.code, 'forbidden')
  assert.equal(result.reason, 'pending')
})

test('an unrecognized role is refused as no_org', () => {
  const token = makeToken({ o: { id: ORG_ID, rol: 'guest' } })
  const result = verify(token)
  assert.equal(result.ok, false)
  assert.equal(result.reason, 'no_org')
})

test('an unknown kid (key not in the JWKS) is refused', () => {
  const token = makeToken({}, { kid: 'some-other-key' })
  const result = verify(token)
  assert.equal(result.ok, false)
  assert.equal(result.code, 'unauthenticated')
  assert.equal(result.reason, 'unknown_key')
})

test('the issuer\'s key address being unreachable with no cache is refused as unavailable', () => {
  const token = makeToken({})
  const result = verify(token, {
    lookupKey: () => { throw new Error('network error') }
  })
  assert.equal(result.ok, false)
  assert.equal(result.code, 'unavailable')
  assert.equal(result.reason, 'keys_unavailable')
})

test('a cached key is used when the live fetch would have failed (simulated by lookupKey serving from cache)', () => {
  // In production this is clerkLookupKeyGas_'s job (cache-first, GAS only).
  // At the pure-function level we only need to prove verifyToken accepts
  // whatever lookupKey hands back, cache-served or not.
  const token = makeToken({})
  const result = verify(token, { lookupKey: (kid) => (kid === jwk.kid ? jwk : null) })
  assert.equal(result.ok, true)
})

// ── Signature check internals ────────────────────────────────────────────────

test('verifyRS256Signature rejects a signature verified against the wrong public key', () => {
  const message = 'header.payload'
  const digest = computeDigest(Array.from(Buffer.from(message, 'utf8')))
  const signature = crypto.sign('RSA-SHA256', Buffer.from(message, 'utf8'), {
    key: otherKeyPair.privateKey,
    padding: crypto.constants.RSA_PKCS1_PADDING
  })
  const ok = ClerkAuth.verifyRS256Signature(digest, Array.from(signature), jwk)
  assert.equal(ok, false)
})

test('verifyRS256Signature accepts a correctly signed digest', () => {
  const message = 'header.payload'
  const digest = computeDigest(Array.from(Buffer.from(message, 'utf8')))
  const signature = crypto.sign('RSA-SHA256', Buffer.from(message, 'utf8'), {
    key: privateKey,
    padding: crypto.constants.RSA_PKCS1_PADDING
  })
  const ok = ClerkAuth.verifyRS256Signature(digest, Array.from(signature), jwk)
  assert.equal(ok, true)
})
