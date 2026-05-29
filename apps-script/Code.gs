/**
 * ============================================================
 * Venue Seat Map — Google Apps Script Web App
 * File: apps-script/Code.gs
 *
 * SETUP STEPS
 * ───────────────────────────────────────────────────────────
 * 1. Create a new Google Spreadsheet.
 *    The script will auto-create these sheets on first use:
 *      • ServiceSummary  — one row per saved service session
 *      • SyncLog         — audit trail of all API calls
 *
 * 2. In Apps Script: Project Settings → Script Properties → Add:
 *      SHEET_ID   = <spreadsheet ID from URL>
 *      AUTH_TOKEN = <any secret string, must match VITE_GAS_TOKEN>
 *
 * 3. Deploy → New deployment → Web App
 *      Execute as : Me
 *      Who has access : Anyone
 *    Copy the Web App URL → VITE_GAS_URL in your .env.local
 *
 * 4. After any code change, create a NEW deployment or edit
 *    the existing one via "Manage deployments".
 *
 * CORS NOTE
 * ───────────────────────────────────────────────────────────
 * The PWA client must POST with:
 *   Content-Type: text/plain;charset=utf-8
 *
 * "text/plain" is a CORS "simple" content-type, so the browser
 * skips the OPTIONS preflight request that GAS cannot handle
 * (which causes the 405 + missing CORS header error).
 * GAS still receives the full JSON string in e.postData.contents
 * and JSON.parse() works identically — no server-side change needed.
 *
 * In appsScript.js (client), the POST options block must be:
 *   headers: { 'Content-Type': 'text/plain;charset=utf-8' },
 *   body:    JSON.stringify(params),
 * ============================================================
 */

// ── Sheet names ───────────────────────────────────────────────────────────────
var SHEET_NAMES = {
  SUMMARY: 'ServiceSummary',
  LOG:     'SyncLog',
}

// ── ServiceSummary column order ───────────────────────────────────────────────
// Exactly the values the PWA sends — nothing more, nothing less.
var SUMMARY_COLUMNS = [
  'date',       // e.g. "May 26, 2026"
  'isoDate',    // e.g. "2026-05-26T08:00:00.000Z"
  'service',    // e.g. "Tuesday Service"
  'men',
  'women',
  'children',
  'total',
  'savedAt',    // server timestamp (added by GAS)
]

// ── Auth ──────────────────────────────────────────────────────────────────────
function isAuthorized(token) {
  var expected = PropertiesService.getScriptProperties().getProperty('AUTH_TOKEN')
  if (!expected) {
    // If no token is set, log a warning but allow through (useful first-run)
    console.warn('AUTH_TOKEN not set in Script Properties — requests are unprotected!')
    return true
  }
  return String(token) === String(expected)
}

// ── Response helpers ──────────────────────────────────────────────────────────

/**
 * jsonOut
 * Serialises data as JSON text output.
 *
 * CORS: For "simple" requests (text/plain body, no custom headers),
 * GAS automatically includes Access-Control-Allow-Origin: * in its
 * response. No manual header manipulation is possible or needed here —
 * ContentService does not expose setHeader(). The CORS guarantee only
 * holds when the client avoids triggering a preflight (see CORS NOTE
 * at the top of this file).
 */
function jsonOut(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON)
}

function errOut(msg) {
  return jsonOut({ ok: false, error: msg })
}

// ── GET handler ───────────────────────────────────────────────────────────────
function doGet(e) {
  var token  = (e.parameter && e.parameter.token)  || ''
  var action = (e.parameter && e.parameter.action) || ''

  if (!isAuthorized(token)) return errOut('Unauthorized')

  try {
    switch (action) {
      case 'healthCheck':
        return jsonOut({ ok: true, ts: Date.now(), message: 'Venue Map GAS is running' })

      case 'getSummaries':
        return jsonOut(getSummaries())

      default:
        return errOut('Unknown GET action: ' + action)
    }
  } catch (err) {
    console.error('doGet error:', err)
    return errOut('Server error: ' + err.message)
  }
}

// ── POST handler ──────────────────────────────────────────────────────────────
function doPost(e) {
  var token = (e.parameter && e.parameter.token) || ''
  if (!isAuthorized(token)) return errOut('Unauthorized')

  // e.postData.contents holds the raw request body as a string.
  // This works for both Content-Type: application/json and text/plain —
  // GAS does not filter by content-type.
  if (!e.postData || !e.postData.contents) {
    return errOut('Empty request body')
  }

  var body
  try {
    body = JSON.parse(e.postData.contents)
  } catch (err) {
    return errOut('Invalid JSON body: ' + err.message)
  }

  var action = body.action || ''

  try {
    switch (action) {
      case 'saveServiceSummary':
        return jsonOut(saveServiceSummary(body))

      default:
        return errOut('Unknown POST action: ' + action)
    }
  } catch (err) {
    console.error('doPost error:', err)
    return errOut('Server error: ' + err.message)
  }
}

// ── Sheet helpers ─────────────────────────────────────────────────────────────
function getSpreadsheet() {
  var id = PropertiesService.getScriptProperties().getProperty('SHEET_ID')
  if (!id) throw new Error('SHEET_ID not configured in Script Properties.')
  return SpreadsheetApp.openById(id)
}

/**
 * Get a sheet by name, creating it with a header row if it doesn't exist.
 */
function getOrCreateSheet(ss, name, headers) {
  var sheet = ss.getSheetByName(name)
  if (!sheet) {
    sheet = ss.insertSheet(name)
    var headerRange = sheet.getRange(1, 1, 1, headers.length)
    headerRange.setValues([headers])
    headerRange.setFontWeight('bold').setBackground('#f3f4f6')
    sheet.setFrozenRows(1)
    // Auto-resize columns
    for (var i = 1; i <= headers.length; i++) {
      sheet.setColumnWidth(i, 140)
    }
  }
  return sheet
}

// ── Business logic ────────────────────────────────────────────────────────────

/**
 * saveServiceSummary
 * Appends one row to the ServiceSummary sheet.
 *
 * Expected body fields:
 *   date, isoDate, service, men, women, children, total
 */
function saveServiceSummary(body) {
  // Validate required fields
  var required = ['date', 'service', 'men', 'women', 'children', 'total']
  for (var i = 0; i < required.length; i++) {
    if (body[required[i]] === undefined || body[required[i]] === null) {
      throw new Error('Missing required field: ' + required[i])
    }
  }

  var ss    = getSpreadsheet()
  var sheet = getOrCreateSheet(ss, SHEET_NAMES.SUMMARY, SUMMARY_COLUMNS)

  var rowData = [
    String(body.date),
    String(body.isoDate  || new Date().toISOString()),
    String(body.service),
    Number(body.men)      || 0,
    Number(body.women)    || 0,
    Number(body.children) || 0,
    Number(body.total)    || 0,
    new Date().toISOString(),  // server-side savedAt
  ]

  sheet.appendRow(rowData)
  appendLog(ss, 'saveServiceSummary', body.service, 1)

  return {
    ok:      true,
    message: 'Service summary saved',
    row:     sheet.getLastRow(),
    data: {
      date:     body.date,
      service:  body.service,
      men:      Number(body.men),
      women:    Number(body.women),
      children: Number(body.children),
      total:    Number(body.total),
    }
  }
}

/**
 * getSummaries
 * Returns all rows from the ServiceSummary sheet as an array of objects.
 */
function getSummaries() {
  var ss    = getSpreadsheet()
  var sheet = getOrCreateSheet(ss, SHEET_NAMES.SUMMARY, SUMMARY_COLUMNS)

  var lastRow = sheet.getLastRow()
  if (lastRow < 2) return { summaries: [] }

  var data = sheet.getRange(2, 1, lastRow - 1, SUMMARY_COLUMNS.length).getValues()

  var summaries = data
    .filter(function(row) { return row[0] })  // skip blank rows
    .map(function(row) {
      var obj = {}
      SUMMARY_COLUMNS.forEach(function(col, idx) { obj[col] = row[idx] })
      return obj
    })
    .reverse()  // most recent first

  return { summaries: summaries, count: summaries.length }
}

// ── Audit log ─────────────────────────────────────────────────────────────────
function appendLog(ss, operation, entityId, count) {
  try {
    var sheet = getOrCreateSheet(ss, SHEET_NAMES.LOG,
      ['timestamp', 'isoDate', 'operation', 'entityId', 'count'])
    sheet.appendRow([
      Date.now(),
      new Date().toISOString(),
      operation,
      String(entityId),
      Number(count),
    ])
  } catch (e) {
    // Log failures are non-fatal — don't let them break the main operation
    console.warn('SyncLog write failed:', e.message)
  }
}