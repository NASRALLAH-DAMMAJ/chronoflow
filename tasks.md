# ChronoFlow — Development Roadmap

## Phase 0: Bug Fixes & Foundation

### Milestone 0.1: Zoom system overhaul

| # | Task | File | Est. |
|---|------|------|------|
| 0.1.1 | `drawCurrentTime` — accept `zoomRange`, call `toRenderMinute` | `DialCanvas.js` | 15m |
| 0.1.2 | `drawBlocks` — clamp render minutes to 0-1440, clip straddling blocks at zoom boundaries | `DialCanvas.js` | 30m |
| 0.1.3 | Sync `innerR` to same value (0.55) across render and hit detection | `DialCanvas.js`, `useDialInteraction.js` | 5m |
| 0.1.4 | Pan: shift+scroll on desktop + two-finger drag on touch | `Dial.jsx` | 45m |
| 0.1.5 | Fix zoom-out from full view: keep `zoomRange=null` | `Dial.jsx` | 10m |
| 0.1.6 | Double-click empty dial resets zoom to full day | `Dial.jsx` | 15m |

### Milestone 0.2: Theme fix

| # | Task | File | Est. |
|---|------|------|------|
| 0.2.1 | Pass `isDark` prop to `Dial`, add to canvas effect deps | `App.jsx`, `Dial.jsx` | 10m |

### Milestone 0.3: Test suite

| # | Task | File | Est. |
|---|------|------|------|
| 0.3.1 | Unit tests: `zoom-utils.js` (round-trip, edge cases) | `tests/zoom-utils.test.js` | 20m |
| 0.3.2 | Unit tests: `reducer.js` (every action type, snap, wraparound) | `tests/reducer.test.js` | 30m |
| 0.3.3 | Unit tests: `constants.js` | `tests/constants.test.js` | 10m |
| 0.3.4 | Interaction tests: hit detection at all zoom levels | Manual / Playwright | 30m |
| 0.3.5 | Interaction tests: drag move, resize, placement flow | Manual / Playwright | 30m |
| 0.3.6 | Interaction tests: zoom scroll, pinch, pan, reset | Manual / Playwright | 30m |
| 0.3.7 | Visual test: theme toggle -> dial redraws correctly | Manual | 5m |
| 0.3.8 | Manual QA checklist (login, CRUD, zoom, theme, navigation) | `TEST_PLAN.md` | 20m |

---

## Phase 1: Web App — Supabase + Vercel

### Milestone 1.0: Setup

| # | Task | Est. |
|---|------|------|
| 1.0.1 | Create Supabase project, enable Google OAuth (copy Client ID + Secret) | 20m |
| 1.0.2 | Create Vercel project linked to GitHub repo | 10m |
| 1.0.3 | Write SQL tables: `profiles`, `settings`, `blocks`, `recurring_rules` with RLS policies | 30m |
| 1.0.4 | Set up Supabase Edge Functions (Deno) with `generate-schedule` scaffold | 30m |

### Milestone 1.1: Auth + Routing

| # | Task | Est. |
|---|------|------|
| 1.1.1 | Install `@supabase/supabase-js`, `@supabase/auth-ui-react`, `react-router-dom` | 5m |
| 1.1.2 | Create `SupabaseContext.jsx` — init client, expose `supabase` + `session` + `user` | 20m |
| 1.1.3 | Create `LoginPage.jsx` with Auth UI (Google OAuth), redirect to `/` on success | 20m |
| 1.1.4 | Create `ProtectedRoute.jsx` — redirect to `/login` if no session | 10m |
| 1.1.5 | Add react-router: `/login`, `/`, `/settings`, `/analytics`, `/archive` | 15m |

### Milestone 1.2: Migrate from localStorage to Supabase

| # | Task | Est. |
|---|------|------|
| 1.2.1 | Replace `localStorage` block CRUD with Supabase `blocks` table queries | 45m |
| 1.2.2 | Replace `localStorage` completed-days with Supabase | 15m |
| 1.2.3 | Add loading states while fetching from Supabase | 15m |
| 1.2.4 | Remove all `localStorage` code from `StoreContext.jsx` and `reducer.js` | 10m |

### Milestone 1.3: Edge Function — `generate-schedule`

| # | Task | Est. |
|---|------|------|
| 1.3.1 | `generate-schedule/index.ts` — accept `user_id` + `date`, return explicit blocks + generated recurring blocks + sleep block | 45m |
| 1.3.2 | Frontend: on date change, call Edge Function, merge into local state | 20m |
| 1.3.3 | Handle recurring block exclusions (skip/override) | 20m |

### Milestone 1.4: Recurring Rules

| # | Task | Est. |
|---|------|------|
| 1.4.1 | CRUD UI for recurring rules (list, add, edit, delete) | 45m |
| 1.4.2 | Context menu on recurring block: "Edit this day" / "Edit rule" / "Skip this occurrence" | 45m |
| 1.4.3 | Visual indicator on dial for recurring blocks (differentiated style) | 15m |

### Milestone 1.5: Settings + Sleep

| # | Task | Est. |
|---|------|------|
| 1.5.1 | `SettingsPage.jsx` — sleep/wake time pickers, theme toggle, profile info | 30m |
| 1.5.2 | Auto-generate sleep block on login/date change from settings | 20m |
| 1.5.3 | Lock sleep blocks on dial (no drag, no resize, no delete unless in settings) | 20m |

### Milestone 1.6: Archive

| # | Task | Est. |
|---|------|------|
| 1.6.1 | `ArchivePage.jsx` — paginated list of archived blocks, filter by date/category | 30m |
| 1.6.2 | Archive/restore buttons on block in BlockList and ArchivePage | 15m |

### Milestone 1.7: Analytics

| # | Task | Est. |
|---|------|------|
| 1.7.1 | Install `recharts` | 2m |
| 1.7.2 | `AnalyticsPage.jsx` — date range picker | 15m |
| 1.7.3 | Category breakdown (pie/donut chart) | 20m |
| 1.7.4 | Daily totals over range (stacked bar chart) | 20m |
| 1.7.5 | Sleep consistency chart (bedtime vs target, wake time vs target) | 25m |
| 1.7.6 | Streak heatmap (GitHub-style grid) | 30m |
| 1.7.7 | Monthly summary cards (averages, totals, category ranking) | 20m |
| 1.7.8 | Sleep analysis cards (avg deviation, consistency score, weekly trend) | 20m |

### Milestone 1.8: PDF Export

| # | Task | Est. |
|---|------|------|
| 1.8.1 | Install `@react-pdf/renderer` | 2m |
| 1.8.2 | `ReportPDF.jsx` — plain/report-style template (daily, weekly, monthly) | 40m |
| 1.8.3 | `VisualPDF.jsx` — app-style colored template with chart snapshots | 40m |
| 1.8.4 | Download buttons on Analytics page for each export variant | 10m |

### Milestone 1.9: Deploy

| # | Task | Est. |
|---|------|------|
| 1.9.1 | Push to GitHub | 5m |
| 1.9.2 | Vercel deploy (set `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` env vars) | 15m |
| 1.9.3 | Deploy Edge Functions via Supabase CLI | 15m |
| 1.9.4 | Full flow test: login -> dial -> add/edit -> recurring -> settings -> analytics -> PDF | 20m |

---

## Phase 2: Android App (Native Kotlin)

### Milestone 2.0: Scaffold

| # | Task | Est. |
|---|------|------|
| 2.0.1 | Create Android project (Kotlin, min API 26, no Compose) | 15m |
| 2.0.2 | Create package structure: `db/`, `ui/`, `sync/`, `api/`, `model/` | 10m |
| 2.0.3 | Add Jetpack dependencies: `WorkManager`, `Security-Crypto`, `Activity-Result` | 10m |

### Milestone 2.1: Local DB

| # | Task | Est. |
|---|------|------|
| 2.1.1 | `DatabaseHelper` — create tables: `blocks`, `recurring_rules`, `settings` | 30m |
| 2.1.2 | CRUD operations for all tables (ContentValues + SQL queries) | 30m |
| 2.1.3 | Mark dirty/deleted rows for sync tracking | 15m |

### Milestone 2.2: Dial Custom View

| # | Task | Est. |
|---|------|------|
| 2.2.1 | `DialView` — extend `View`, override `onDraw(Canvas)` | 45m |
| 2.2.2 | Port dial math: render minutes, angles, zoom mapping | 30m |
| 2.2.3 | Draw blocks with colors, labels, current time line | 30m |
| 2.2.4 | Touch hit detection + gesture handling (tap, long-press drag, edge resize) | 45m |
| 2.2.5 | Zoom: pinch (`ScaleGestureDetector`) + scroll wheel + pan | 30m |
| 2.2.6 | Sleep block rendering (striped pattern) | 15m |

### Milestone 2.3: UI Screens

| # | Task | Est. |
|---|------|------|
| 2.3.1 | `MainActivity` — hosts DialView + RecyclerView block list below | 20m |
| 2.3.2 | `BlockAdapter` + block list item layout (color bar, label, time, category badge) | 20m |
| 2.3.3 | `AddEditBlockDialog` — label, category, duration picker | 25m |
| 2.3.4 | `SettingsActivity` — sleep/wake time pickers, theme toggle | 20m |
| 2.3.5 | `RecurringRulesActivity` — list + add/edit dialog | 30m |
| 2.3.6 | `ArchiveActivity` — list with search/filter + restore | 20m |
| 2.3.7 | `AnalyticsActivity` — custom Canvas charts (pie, bar, heatmap, sleep) | 60m |
| 2.3.8 | `LoginActivity` — Google Sign-In button via CredentialManager | 30m |

### Milestone 2.4: Sync

| # | Task | Est. |
|---|------|------|
| 2.4.1 | `SyncService` — foreground service, triggered by `ConnectivityManager` | 30m |
| 2.4.2 | Push: query `is_dirty=1` rows, batch POST to Supabase REST API | 20m |
| 2.4.3 | Pull: fetch latest data for current + upcoming dates, merge into local SQLite | 20m |
| 2.4.4 | Manual "Sync" button in action bar | 10m |
| 2.4.5 | Handle conflicts (last-write-wins by `updated_at`) | 15m |

### Milestone 2.5: PDF Export

| # | Task | Est. |
|---|------|------|
| 2.5.1 | `PdfReportGenerator` — `PdfDocument` with tables + text (report style) | 30m |
| 2.5.2 | `PdfVisualGenerator` — Canvas-drawn charts + colors (visual style) | 30m |
| 2.5.3 | Save to Downloads, share intent | 10m |

### Milestone 2.6: Polish + Release

| # | Task | Est. |
|---|------|------|
| 2.6.1 | Dark/light theme following system + manual toggle | 15m |
| 2.6.2 | Edge case handling (no network, empty state, errors) | 20m |
| 2.6.3 | Generate signed APK / App Bundle | 15m |
| 2.6.4 | Manual QA pass on device | 30m |

---

## Milestone Summary

| Milestone | Phase | Tasks | Est. total |
|-----------|-------|-------|------------|
| 0.1 Zoom overhaul | 0 | 6 | ~2h |
| 0.2 Theme fix | 0 | 1 | ~10m |
| 0.3 Test suite | 0 | 8 | ~3h |
| 1.0 Setup | 1 | 4 | ~1.5h |
| 1.1 Auth + Routing | 1 | 5 | ~1h |
| 1.2 Supabase migration | 1 | 4 | ~1.5h |
| 1.3 Edge Function | 1 | 3 | ~1.5h |
| 1.4 Recurring rules | 1 | 3 | ~1.5h |
| 1.5 Settings + Sleep | 1 | 3 | ~1h |
| 1.6 Archive | 1 | 2 | ~45m |
| 1.7 Analytics | 1 | 8 | ~2.5h |
| 1.8 PDF Export | 1 | 4 | ~1.5h |
| 1.9 Deploy | 1 | 4 | ~1h |
| 2.0 Scaffold | 2 | 3 | ~35m |
| 2.1 Local DB | 2 | 3 | ~1.25h |
| 2.2 Dial View | 2 | 6 | ~3.5h |
| 2.3 UI Screens | 2 | 8 | ~4h |
| 2.4 Sync | 2 | 5 | ~1.5h |
| 2.5 PDF Export | 2 | 3 | ~1h |
| 2.6 Polish | 2 | 4 | ~1.25h |

---

## Runbook: Commands & How-Tos

```bash
# Web app
npm install                    # Install deps
npm run dev                    # Dev server (Vite)
npm run build                  # Production build
npx vite preview               # Preview production build

# Supabase
npx supabase init              # Init Edge Functions
npx supabase functions serve   # Local Edge Function dev
npx supabase functions deploy generate-schedule

# Deploy
git push origin main           # Vercel auto-deploys on push
vercel --prod                  # Manual Vercel deploy

# Android
./gradlew assembleDebug        # Build debug APK
./gradlew bundleRelease        # Build release App Bundle
```

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Auth | Google OAuth only | Single provider, simplest UX |
| Database | Supabase PostgreSQL | Online, free tier, RLS, Edge Functions |
| Web deploy | Vercel | Free, auto-deploys from GitHub |
| Android charts | Custom Canvas draw | Zero dependencies |
| Android sync | Auto + manual button | Both for reliability |
| Dial interaction (touch) | Tap to select, long-press to drag, pinch to zoom | Best for touch accuracy |
| PDF | Two styles (report + visual) | User requested both |
| Recurring edit | Context menu: "Edit this day" / "Edit rule" / "Skip" | Covers all use cases |
