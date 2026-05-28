# Church Seat Map — PWA

An offline-first Progressive Web App for tracking church service attendance by seat.  
Ushers tap each seat → mark **M** (Man), **W** (Woman), or **C** (Child).  
Live counts are shown in a sidebar legend and saved to Google Sheets with one tap.

---

## Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + Vite 5 |
| PWA | vite-plugin-pwa + Workbox |
| Styling | Tailwind CSS v3 + Inter font |
| Canvas | React Konva |
| State | Zustand + `persist` middleware (localStorage) |
| Server requests | TanStack Query v5 |
| Backend | Google Apps Script Web App |
| Data store | Google Sheets |

---

## Project Structure

```
venue-map/
├── apps-script/
│   └── Code.gs                     ← Google Apps Script backend
├── public/
│   ├── favicon.svg
│   ├── manifest.json
│   ├── pwa-192.png                 ← generate these (see below)
│   └── pwa-512.png
├── src/
│   ├── App.jsx                     ← Root layout shell
│   ├── main.jsx                    ← React entry point
│   ├── globals.css                 ← Tailwind + CSS vars
│   ├── components/
│   │   ├── canvas/
│   │   │   └── ChurchCanvas.jsx    ← Konva stage with all seats
│   │   └── ui/
│   │       ├── SeatPopup.jsx       ← M/W/C selection popup
│   │       ├── ServiceLegend.jsx   ← Right sidebar + save button
│   │       ├── OfflineBanner.jsx
│   │       ├── Toast.jsx
│   │       └── InstallPrompt.jsx
│   ├── data/
│   │   └── churchLayout.js         ← All seat positions + table positions
│   ├── store/
│   │   ├── churchStore.js          ← Zustand seat state (localStorage)
│   │   └── uiStore.js              ← Zoom, toasts, UI flags
│   ├── hooks/
│   │   ├── useVenue.js
│   │   ├── useSync.js
│   │   ├── useOnlineStatus.js
│   │   └── useInstallPrompt.js
│   └── lib/
│       ├── appsScript.js           ← fetch wrapper for GAS endpoint
│       └── queryClient.js
├── .env.example
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
└── vite.config.js
```

---

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Generate PWA icons

You need `public/pwa-192.png` and `public/pwa-512.png`.

```bash
# Option A — pwa-asset-generator (recommended)

# Option B — any image editor, export at 192×192 and 512×512
```

### 3. Configure environment

```bash
cp .env.example .env.local
# Edit .env.local — paste your GAS URL and token
```

For local dev without Google Sheets, leave the URL blank.  
The app works fully offline; Saving will simply show an error toast.

### 4. Run

```bash
npm run dev
# Open http://localhost:5173
```

---

## Google Apps Script Setup

### Step 1 — Create a Google Spreadsheet

1. Go to https://sheets.google.com → create a new spreadsheet.
2. Copy the **Spreadsheet ID** from the URL:  
   `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`  
   The GAS script will auto-create the `ServiceSummary` and `SyncLog` sheets on first use.

### Step 2 — Create the Apps Script project

1. In the spreadsheet: **Extensions → Apps Script**.
2. Delete the default `Code.gs` content.
3. Paste the full contents of `apps-script/Code.gs`.
4. **Project Settings → Script Properties → Add property:**
   - `SHEET_ID` → your spreadsheet ID
   - `AUTH_TOKEN` → any secret string (e.g. `openssl rand -hex 16`)

### Step 3 — Deploy

1. **Deploy → New deployment → Web app**
2. Execute as: `Me`
3. Who has access: `Anyone`
4. Click **Deploy** → copy the Web App URL.

### Step 4 — Wire up the PWA

In `.env.local`:
```
VITE_GAS_URL=https://script.google.com/macros/s/YOUR_ID/exec
VITE_GAS_TOKEN=your-secret-token-here
```

> Re-deploy (or update existing deployment) every time you edit `Code.gs`.

---

## Build & Deploy

```bash
npm run build    # outputs to dist/
```

Deploy the `dist/` folder to any static host with HTTPS:

- **Cloudflare Pages** — build command: `npm run build`, output: `dist`
- **Vercel** — `vercel --prod`
- **Netlify** — drag-and-drop the `dist/` folder
- **Firebase Hosting** — `firebase deploy`

HTTPS is required for the service worker to register.

---

## How the app works

### Tapping a seat
1. Tap any seat on the canvas.
2. A popup appears above the seat with three buttons: **👨 Man**, **👩 Woman**, **👶 Child**.
3. Tap a button — the seat fills with the initial letter (M / W / C) in the matching colour.
4. Tap the same seat again to re-assign or clear it.

### Seat colours
| Colour | Meaning |
|---|---|
| Blue tint + **M** | Man |
| Pink tint + **W** | Woman |
| Yellow tint + **C** | Child |
| White | Empty |
| Violet outline | Currently selected |

### Service legend (right sidebar / bottom bar)
- Shows the **service name** determined by the current day:  
  Monday Service, Tuesday Service … Sunday Service.
- Shows **live counts** of Men, Women, Children, and Total.
- Shows **capacity bar** (total seated / total seats).

### Saving to Google Sheets
1. Click **💾 Save to Google Sheets** in the legend.
2. One row is appended to the `ServiceSummary` sheet with:
   - Date (e.g. `May 26, 2026`)
   - ISO date
   - Service name (e.g. `Tuesday Service`)
   - Men count
   - Women count
   - Children count
   - Total count
   - Server timestamp

### Reset
Click **Reset all seats** (bottom of the legend) → confirm → all seats cleared.  
Use this between services.

### Offline
All seat state is saved to **localStorage** — the app works fully offline.  
The Save button requires internet to reach Google Sheets; it shows an offline warning if not connected.

---

## Seat layout reference

Total interactive seats: **166**

| Section | Seats |
|---|---|
| Worshipers (front-left) | 20 (5 rows × 4) |
| Left small | 12 (3 rows × 4) |
| Left block + top row | 28 (5×5 + 3) |
| Center block + top row | 39 (5×7 + 4) |
| Right block + top row | 33 (5×6 + 3) |
| Far-right small | 15 (3 rows × 5) |
| Bottom-left row | 9 |
| Bottom-right row | 5 |
| Media seats | 5 |

---

## License

MIT
