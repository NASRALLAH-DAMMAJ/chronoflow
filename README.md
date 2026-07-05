# ChronoFlow

I kept losing track of my days. Calendar apps felt like spreadsheets. Todo lists just added guilt. I wanted something that shows me *where my time actually goes* — not where I plan to spend it.

So I built a 24-hour circular dial. You drag blocks around, resize them, and at the end of the day you mark it done. Over time you build a memory of your days.

## What it does

You get a circle. The whole circle is 24 hours. You drag colored blocks onto it to say "I did this thing at this time." That's pretty much it.

- **Drag to place** — click the dial, pick a label and color, drop it wherever
- **Drag to move** — grab a block and slide it around the circle
- **Drag edges to resize** — stretch or shrink a block by pulling its edges
- **Zoom in** — scroll to zoom into a section of the day, shift+scroll to pan around
- **Night review** — hit the checkmark when you go to bed, track your streak
- **Browse history** — navigate to any past day and see what you did
- **Dark mode** — because everyone asks

## Why a circle?

Clocks are circles. Days are circular. A linear timeline never made sense to me — the hours wrap around, so the visualization should too. You can see the whole day at a glance without scrolling.

## Running it

```
pnpm install
pnpm dev
```

Opens at `http://localhost:5173`.

## Building for production

```
pnpm build
```

Spits out a `dist/` folder. You can serve it with any static server. There's a `server.cjs` included if you want to just run `node server.cjs` and open `http://localhost:5173`.

## What I used

React 18, Vite, and the Canvas 2D API. No UI libraries, no calendar packages, no state management libraries. Just React hooks and a `<canvas>` element. The dial is drawn pixel by pixel.

Theming is done with CSS custom properties — one toggle switches all the colors.

## License

MIT

---

# Production & V2 Milestone Plan

> **Scope:** Polish to production-ready, deliver V2 features.
> **Platform:** PWA-first — mobile experience is the web app in the browser.
> **E2E tests:** Minimum 20 end-to-end test scenarios (web + mobile web).
> **Cadence:** Each milestone includes test, polish, and verification tasks for everything added.
>
> **Total tasks:** ~280 across 15 milestones (46 weeks estimated)

---

## M1 — Critical Bugs & Data Integrity Fixes
*Fix everything that's broken right now. Blocks not saving, duplicate data, missing constraints.*

### DB Schema & Data Integrity
- [x] Add unique constraint on `blocks(user_id, date, start_min)` — prevents duplicate blocks at same time
- [x] Add unique constraint on `recurring_rules(user_id, label, category, start_time)` — prevents duplicate rules
- [x] Add `updated_at` column to `blocks` table with auto-update trigger
- [x] Add `created_at` column to `blocks` table with default `now()`
- [x] Add composite index on `blocks(user_id, date)` for faster day queries
- [x] Add index on `recurring_rules(user_id)` for faster rule lookups
- [x] Fix `upsertBlocks` to use new unique constraint for conflict resolution
- [x] Write migration SQL: `ALTER TABLE blocks ADD CONSTRAINT blocks_user_date_start_unique UNIQUE (user_id, date, start_min);`
- [x] Write migration SQL: `ALTER TABLE recurring_rules ADD CONSTRAINT recurring_rules_user_label_cat_start_unique UNIQUE (user_id, label, category, start_time);`
- [x] Write migration SQL: `ALTER TABLE blocks ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();`
- [x] Write migration SQL: `ALTER TABLE blocks ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();`
- [x] Write migration SQL: `CREATE INDEX IF NOT EXISTS idx_blocks_user_date ON blocks(user_id, date);`
- [x] Write migration SQL: `CREATE INDEX IF NOT EXISTS idx_recurring_rules_user ON recurring_rules(user_id);`
- [x] **Test:** Run migration on staging DB — verify no errors
- [x] **Test:** Insert duplicate block → verify constraint violation
- [x] **Test:** Insert duplicate recurring rule → verify constraint violation

### Block Persistence Fixes
- [x] Fix `fetchBlocks` to handle edge case: blocks with `start_min` outside 0-1439 range
- [x] Fix `upsertBlocks` to validate `start_min` and `end_min` before DB write
- [x] Fix `deleteBlock` to verify user owns block before delete (RLS double-check)
- [x] Fix `archiveBlock` to set `archived_at` timestamp correctly
- [x] Add validation: `start_min` must be 0-1439, `end_min` must be 1-1440, `end_min > start_min`
- [x] Add validation: `category` must be one of the allowed values
- [x] Add validation: `label` must be non-empty string, max 100 chars
- [x] Add validation: `date` must be valid ISO date string
- [x] Fix `withRetry` to not retry on 409 Conflict (constraint violation) — throw immediately
- [x] **Test:** Create block with invalid `start_min` → verify validation error
- [x] **Test:** Create block with `end_min <= start_min` → verify validation error
- [x] **Test:** Create block with empty label → verify validation error
- [x] **Test:** Create block with invalid date → verify validation error

### Init Flow Fixes
- [x] Fix init race condition: ensure `SET_LOADING` fires even if DB calls fail
- [x] Fix init to handle `fetchBlocks` returning empty array (new user) vs null (error)
- [x] Fix init to handle `fetchRecurringRules` failing gracefully (don't block init)
- [x] Fix init to handle `fetchSettings` failing gracefully (use defaults)
- [x] Fix init to handle `fetchProfile` failing gracefully (use defaults)
- [x] Add timeout to init: if DB calls take >5s, show error banner
- [x] **Test:** Init with network offline → verify error banner, app loads with defaults
- [x] **Test:** Init with expired auth token → verify redirect to login
- [x] **Test:** Init with valid auth → verify blocks load correctly

### Auto-Save Fixes
- [x] Fix auto-save to handle rapid consecutive saves (debounce correctly)
- [x] Fix auto-save to handle save failure mid-sequence (queue retry)
- [x] Fix auto-save to handle auth expiry during save (show re-auth prompt)
- [x] Fix auto-save to handle network timeout (show retry button)
- [x] Add `dbError` state: red error banner in App when save fails
- [x] Add `dbError` to be cleared on successful save
- [x] Add `dbError` to be cleared on manual dismiss
- [x] **Test:** Rapid block edits → verify all saves complete
- [x] **Test:** Auth expires mid-save → verify re-auth prompt
- [x] **Test:** Network fails mid-save → verify retry button appears
- [x] **Test:** Dismiss error banner → verify it clears

---

## M2 — Progress Bar for Concurrent Tasks
*Show progress when 2+ async tasks are running simultaneously.*

### Task Queue System
- [x] Create `src/lib/taskQueue.js` — manages concurrent async tasks with progress
- [x] Implement `TaskQueue` class with: `add(task)`, `remove(id)`, `onProgress(callback)`, `onComplete(callback)`, `onError(callback)`
- [x] Implement task deduplication: same task ID won't be added twice
- [x] Implement task priority: high/normal/low (high tasks start first)
- [x] Implement task timeout: tasks that take >30s are cancelled with error
- [x] Implement task cancellation: `queue.cancel(id)` removes pending task
- [x] **Test:** Add 3 tasks → verify all complete
- [x] **Test:** Add duplicate task → verify deduplication
- [x] **Test:** Add high priority task while normal running → verify priority
- [x] **Test:** Task timeout → verify error callback fires

### Progress Bar Component
- [x] Create `src/components/ProgressBar.jsx` — horizontal progress bar
- [x] Implement `min-height: 4px`, `height: 8px` variants
- [x] Implement `variant`: primary, success, warning, error
- [x] Implement `animated: true` for indeterminate progress
- [x] Implement `showLabel: true` for percentage text
- [x] Implement smooth animation with CSS transitions
- [x] Add ARIA attributes: `role="progressbar"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`
- [x] Add reduced-motion support (no animation)
- [x] **Test:** Progress bar renders at 0%, 50%, 100%
- [x] **Test:** Progress bar animates smoothly
- [x] **Test:** Progress bar respects prefers-reduced-motion

### Concurrent Task Indicator
- [x] Create `src/components/TaskIndicator.jsx` — shows active tasks
- [x] Implement floating indicator (bottom-right corner)
- [x] Show task count badge when >0 tasks active
- [x] Show progress bar for each active task
- [x] Show task name and status (loading, saving, syncing)
- [x] Click indicator → expand to show task details
- [x] Implement dismiss (close) — tasks continue in background
- [x] Add animation: slide-in on first task, slide-out on last task
- [x] **Test:** 2 tasks running → indicator appears with count 2
- [x] **Test:** 1 task completes → count decrements
- [x] **Test:** All tasks complete → indicator disappears
- [x] **Test:** Click indicator → task details expand

### Integration with Existing Flows
- [x] Wrap `fetchBlocks` calls in task queue
- [x] Wrap `upsertBlocks` calls in task queue
- [x] Wrap `deleteBlock` calls in task queue
- [x] Wrap `fetchRecurringRules` calls in task queue
- [x] Wrap `fetchAnalytics` calls in task queue
- [x] Wrap `fetchSettings` calls in task queue
- [x] Show TaskIndicator when 2+ tasks active
- [x] **Test:** Create block + navigate day simultaneously → indicator shows
- [x] **Test:** Delete block + fetch analytics → indicator shows
- [x] **Test:** All tasks complete → indicator hides

---

## M3 — Lock/Unlock Tasks (Including Sleep)
*Allow users to lock blocks to prevent accidental movement or deletion.*

### Block Lock Feature
- [x] Add `locked: boolean` field to Block model
- [x] Add `locked` to blockReducer state
- [x] Add `LOCK_BLOCK` action to reducer
- [x] Add `UNLOCK_BLOCK` action to reducer
- [x] Persist `locked` to Supabase `blocks` table
- [x] Add `locked` column to migration SQL
- [x] **Test:** Lock block → verify `locked: true` in state
- [x] **Test:** Unlock block → verify `locked: false` in state

### Lock UI Controls
- [x] Add lock/unlock toggle to block context menu (right-click or long-press)
- [x] Add lock icon overlay on locked blocks (small padlock in corner)
- [x] Add lock/unlock button in block edit form
- [x] Style locked blocks: slight opacity reduction, lock icon visible
- [x] Style unlocked blocks: normal appearance
- [x] **Test:** Lock block from context menu → lock icon appears
- [x] **Test:** Unlock block from context menu → lock icon disappears
- [x] **Test:** Lock block from edit form → lock icon appears
- [x] **Test:** Unlock block from edit form → lock icon disappears

### Lock Behavior
- [x] Locked blocks cannot be dragged on dial
- [x] Locked blocks cannot be resized on dial
- [x] Locked blocks cannot be moved via arrow keys
- [x] Locked blocks CAN be deleted (with confirmation dialog)
- [x] Locked blocks CAN be archived (with confirmation dialog)
- [x] Locked blocks CAN be edited via form (with confirmation dialog)
- [x] Locked blocks show tooltip: "This block is locked. Unlock to move or resize."
- [x] **Test:** Try to drag locked block → verify no movement
- [x] **Test:** Try to resize locked block → verify no resize
- [x] **Test:** Try to move locked block with arrow keys → verify no movement
- [x] **Test:** Try to delete locked block → verify confirmation dialog
- [x] **Test:** Confirm delete locked block → verify deletion
- [x] **Test:** Try to edit locked block → verify confirmation dialog
- [x] **Test:** Confirm edit locked block → verify edit works

### Sleep Block Lock
- [x] Auto-lock sleep blocks when created from settings
- [x] Sleep blocks show lock icon by default
- [x] User can unlock sleep blocks if desired
- [x] Sleep block unlock shows warning: "Unlocking sleep block allows manual adjustment"
- [x] **Test:** Create sleep block via settings → verify locked
- [x] **Test:** Unlock sleep block → verify can be moved
- [x] **Test:** Re-lock sleep block → verify locked again

---

## M4 — Error Handling & User Feedback
*All placeholder functions replaced with real implementations. All error states have UI.*

### Error State UI
- [x] Add error state to dial: "Failed to load blocks. Retry?"
- [x] Add error state to analytics: "Failed to load analytics. Retry?"
- [x] Add error state to archive: "Failed to load archive. Retry?"
- [x] Add error state to settings: "Failed to load settings. Retry?"
- [x] Add error state to recurring rules: "Failed to load rules. Retry?"
- [x] Add error state to block list: "Failed to load blocks. Retry?"
- [x] All error states include retry button and dismiss button
- [x] **Test:** Each page shows error state on fetch failure
- [x] **Test:** Click retry → retries fetch
- [x] **Test:** Click dismiss → error state clears

### Toast Notification System
- [x] Create `src/components/Toast.jsx` — toast notification component
- [x] Implement variants: success, error, warning, info
- [x] Implement auto-dismiss: 3s for success, 5s for info, manual dismiss for error
- [x] Implement stacking: multiple toasts stack vertically
- [x] Implement positioning: bottom-right on desktop, bottom on mobile
- [x] Add animation: slide-in from right, slide-out to right
- [x] Add ARIA live region for screen reader announcements
- [x] **Test:** Show success toast → auto-dismiss after 3s
- [x] **Test:** Show error toast → manual dismiss
- [x] **Test:** Show multiple toasts → stack vertically
- [x] **Test:** Toast announces to screen readers

### Toast Integration
- [x] Show success toast on block create
- [x] Show success toast on block update
- [x] Show success toast on block delete
- [x] Show success toast on block archive
- [x] Show success toast on block restore
- [x] Show success toast on recurring rule create
- [x] Show success toast on recurring rule update
- [x] Show success toast on recurring rule delete
- [x] Show success toast on settings save
- [x] Show success toast on data export
- [x] Show success toast on data import
- [x] Show error toast on any DB failure
- [x] Show warning toast on auth expiry
- [x] Show info toast on offline detection
- [x] **Test:** Create block → success toast appears
- [x] **Test:** Delete block → success toast appears
- [x] **Test:** DB failure → error toast appears
- [x] **Test:** Auth expires → warning toast appears
- [x] **Test:** Go offline → info toast appears

### Placeholder Function Replacements
- [x] Implement `exportToJSON` — export all blocks/rules/settings to JSON file
- [x] Implement `exportToCSV` — export blocks to CSV with date range
- [x] Implement `importFromJSON` — import blocks/rules/settings from JSON
- [x] Implement `importFromCSV` — import blocks from CSV
- [x] Implement `generatePDF` — generate PDF export of day/week
- [x] Implement `shareDay` — share day snapshot as image/link
- [x] Implement `calculateProductivityScore` — real productivity calculation
- [x] Implement `generateWeeklyReport` — weekly summary generation
- [x] **Test:** Export JSON → file downloads with correct data
- [x] **Test:** Export CSV → file downloads with correct columns
- [x] **Test:** Import JSON → blocks appear in app
- [x] **Test:** Import CSV → blocks appear in app
- [x] **Test:** Generate PDF → PDF downloads with correct content
- [x] **Test:** Share day → share dialog/image appears
- [x] **Test:** Calculate productivity → score displays correctly
- [x] **Test:** Generate weekly report → report displays correctly

---

## M5 — Server & Infrastructure Hardening
*Production-grade static server, security headers, compression, proper MIME types.*

### server.cjs Rewrite
- [x] Rewrite `server.cjs` to use `http` module with proper request handling
- [x] Add gzip compression for all text-based responses (HTML, CSS, JS, JSON)
- [x] Add proper MIME type mapping for all file extensions
- [x] Add security headers: `X-Content-Type-Options: nosniff`
- [x] Add security headers: `X-Frame-Options: DENY`
- [x] Add security headers: `X-XSS-Protection: 1; mode=block`
- [x] Add security headers: `Referrer-Policy: strict-origin-when-cross-origin`
- [x] Add security headers: `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- [x] Add `Content-Security-Policy` header for production
- [x] Add cache headers: `Cache-Control: public, max-age=31536000` for hashed assets
- [x] Add cache headers: `Cache-Control: no-cache` for HTML
- [x] Add `ETag` support for conditional requests
- [x] Add `Last-Modified` support for conditional requests
- [x] Add proper 404 page for missing files
- [x] Add proper 403 page for forbidden paths
- [x] Add proper 500 page for server errors
- [x] Add request logging (method, path, status, duration)
- [x] Add rate limiting: 100 requests per minute per IP
- [x] Add request size limit: 10MB max body
- [x] Add path traversal protection (reject `../` in paths)
- [x] Add port configuration via environment variable
- [x] **Test:** Serve static file → correct MIME type
- [x] **Test:** Serve gzip → correct Content-Encoding
- [x] **Test:** Serve with security headers → all present
- [x] **Test:** Path traversal attempt → 403 response
- [x] **Test:** Rate limit exceeded → 429 response
- [x] **Test:** Non-existent file → 404 response

### Vite Build Optimization
- [x] Configure Vite to output hashed filenames for cache busting
- [x] Configure Vite to generate source maps for production debugging
- [x] Configure Vite to split vendor chunks (react, recharts, react-pdf)
- [x] Configure Vite to set build target to `es2020`
- [x] Configure Vite to minify with esbuild
- [x] Add bundle analyzer plugin (already have `rollup-plugin-visualizer`)
- [x] Set bundle size budgets: JS <200KB, CSS <50KB
- [x] **Test:** Build output → hashed filenames
- [x] **Test:** Build output → source maps generated
- [x] **Test:** Build output → chunks split correctly
- [x] **Test:** Bundle size → within budgets

### PWA Configuration
- [x] Create `public/manifest.json` with app name, icons, theme color
- [x] Generate PWA icons (192x192, 512x512, maskable)
- [x] Generate favicon (16x16, 32x32)
- [x] Add `theme-color` meta tag
- [x] Add `apple-mobile-web-app-capable` meta tag
- [x] Add `apple-mobile-web-app-status-bar-style` meta tag
- [x] Register service worker in `index.html`
- [x] Implement service worker with Workbox
- [x] Implement precache strategy for app shell
- [x] Implement runtime cache for Supabase API responses
- [x] Implement offline fallback page
- [x] **Test:** Install PWA → standalone mode
- [x] **Test:** Offline → app shell loads
- [x] **Test:** Offline → create block → queue mutation
- [x] **Test:** Online → queued mutation syncs

---

## M6 — Design System & UI Polish
*Consistent design, micro-interactions, toast system, skeleton loading.*

### Design Token Audit
- [x] Audit all components for consistent use of CSS variables
- [x] Ensure all colors use `--clr-*` variables (no hardcoded hex)
- [x] Ensure all spacing uses `--sp-*` variables (no hardcoded px)
- [x] Ensure all fonts use `--ff-*` variables
- [x] Ensure all font sizes use `--fs-*` variables
- [x] Ensure all border radius uses `--br-*` variables
- [x] Ensure all shadows use `--shadow-*` variables
- [x] Fix any hardcoded values found in audit
- [x] **Test:** Grep for hardcoded hex colors → zero found
- [x] **Test:** Grep for hardcoded px values → zero found

### Component States
- [x] Add hover state to all buttons
- [x] Add active (pressed) state to all buttons
- [x] Add disabled state to all buttons
- [x] Add focus-visible state to all buttons
- [x] Add loading state to all buttons (spinner)
- [x] Add hover state to all cards
- [x] Add active state to all cards
- [x] Add disabled state to all form inputs
- [x] Add error state to all form inputs
- [x] Add success state to all form inputs
- [x] **Test:** All interactive elements have hover/active/focus states

### Micro-Interactions
- [x] Add button press scale animation (transform: scale(0.98))
- [x] Add card hover lift animation (transform: translateY(-2px))
- [x] Add modal open animation (scale from 0.95 to 1, opacity 0 to 1)
- [x] Add modal close animation (reverse of open)
- [x] Add toast slide-in animation (translateX from 100% to 0)
- [x] Add toast slide-out animation (translateX from 0 to 100%)
- [x] Add block appear animation (scale from 0.8 to 1)
- [x] Add block disappear animation (scale from 1 to 0.8)
- [x] Add streak counter increment animation (number roll)
- [x] **Test:** All animations respect prefers-reduced-motion

### Skeleton Loading States
- [x] Add skeleton to dial while blocks load
- [x] Add skeleton to block list while blocks load
- [x] Add skeleton to analytics while data loads
- [x] Add skeleton to archive while data loads
- [x] Add skeleton to settings while data loads
- [x] Add skeleton to recurring rules while data loads
- [x] All skeletons use pulse animation
- [x] All skeletons match content shape
- [x] **Test:** Each page shows skeleton during loading

---

## M7 — Accessibility Deep Dive
*WCAG 2.1 AA compliance, screen reader support, keyboard navigation.*

### ARIA & Screen Reader
- [x] Add `aria-label` to all icon buttons
- [x] Add `aria-live="polite"` to dynamic content areas
- [x] Add `aria-live="assertive"` to error messages
- [x] Add `aria-describedby` to form inputs with help text
- [x] Add `aria-invalid` to form inputs with errors
- [x] Add `aria-expanded` to collapsible sections
- [x] Add `aria-hidden="true"` to decorative elements
- [x] Add screen reader text for dial state (time, blocks)
- [x] **Test:** Navigate with screen reader → all elements announced

### Keyboard Navigation
- [x] Add tab order to all interactive elements
- [x] Add keyboard shortcuts: `Enter` to activate, `Escape` to close
- [x] Add arrow key navigation on dial (move between hours)
- [x] Add `Home`/`End` keys to jump to start/end of day
- [x] Add `Page Up`/`Page Down` to navigate days
- [x] Add focus trap in modals
- [x] Add focus restoration after modal close
- [x] Add skip-to-content link
- [x] **Test:** Tab through all pages → correct order
- [x] **Test:** Keyboard navigate dial → blocks accessible

### Contrast & Color
- [x] Audit all text colors for 4.5:1 contrast ratio
- [x] Audit all interactive elements for 3:1 contrast ratio
- [x] Fix any contrast failures
- [x] Add high-contrast mode support
- [x] **Test:** All text meets 4.5:1 contrast
- [x] **Test:** All interactive elements meet 3:1 contrast

---

## M8 — Mobile Touch & Gesture Polish
*Fluid touch interactions, gesture helpers, mobile-optimized UI patterns.*

### Touch Gestures
- [x] Implement swipe left/right for day navigation
- [x] Implement pull-to-refresh on block list
- [x] Implement long-press context menu on blocks
- [x] Implement pinch-to-zoom on dial canvas
- [x] Implement double-tap to zoom on dial
- [x] Implement drag-to-dismiss on cards
- [x] **Test:** Swipe left → navigate to next day
- [x] **Test:** Swipe right → navigate to previous day
- [x] **Test:** Pull to refresh → blocks reload
- [x] **Test:** Long press block → context menu appears
- [x] **Test:** Pinch zoom → dial zooms
- [x] **Test:** Double tap → dial zooms to fit

### Mobile UI Patterns
- [x] Add bottom sheet component for block form on mobile
- [x] Add mobile-optimized date picker
- [x] Add touch-friendly time picker (spin wheel)
- [x] Add safe-area-inset support for notch phones
- [x] Add momentum scrolling for all scrollable areas
- [x] Add 300ms tap delay fix (touch-action: manipulation)
- [x] **Test:** Block form opens as bottom sheet on mobile
- [x] **Test:** Date picker works on touch devices
- [x] **Test:** Safe area insets respected on notch phones

### Haptic Feedback
- [x] Add vibration on block create
- [x] Add vibration on block delete
- [x] Add vibration on day complete
- [x] Add vibration on error
- [x] **Test:** Block create → vibration fires
- [x] **Test:** Block delete → vibration fires

---

## M9 — Analytics & Data Visualization Enhancements
*Deeper insights, trend lines, custom date ranges, data exploration.*

### Date Range Selection
- [x] Add date range picker component
- [x] Add presets: Today, Last 7 days, Last 30 days, This month, Last month, Custom
- [x] Persist date range preference to settings
- [x] **Test:** Select preset → charts update
- [x] **Test:** Select custom range → charts update

### Advanced Charts
- [x] Add trend line chart for category hours over time
- [x] Add day-of-week heatmap (GitHub-style contribution grid)
- [x] Add productivity score over time chart
- [x] Add comparison mode (this week vs last week)
- [x] Add cumulative hours chart (total tracked over time)
- [x] Add best/worst hour analysis
- [x] Add category breakdown treemap (alternative to pie)
- [x] **Test:** Each chart renders with sample data
- [x] **Test:** Charts update on date range change

### Data Export
- [x] Implement full JSON export (blocks, rules, settings, profile)
- [x] Implement CSV export with date range filter
- [x] Implement PDF export of analytics report
- [x] Add export progress indicator
- [x] **Test:** Export JSON → file downloads
- [x] **Test:** Export CSV → file downloads
- [x] **Test:** Export PDF → file downloads

---

## M10 — Onboarding & Empty States
*Guide new users, reduce churn, make first-run delightful.*

### Onboarding Flow
- [x] Design first-run onboarding (3-5 screens)
- [x] Implement interactive tutorial overlay on first dial visit
- [x] Add progressive disclosure tooltips (feature discovery)
- [x] Add "Quick Start" wizard (set sleep time, add first block)
- [x] **Test:** New user sees onboarding flow
- [x] **Test:** Complete onboarding → app loads
- [x] **Test:** Skip onboarding → app loads

### Empty States
- [x] Design empty state for dial (no blocks)
- [x] Design empty state for archive (no archived blocks)
- [x] Design empty state for analytics (no data)
- [x] Design empty state for recurring rules (no rules)
- [x] Add sample data generator for demo
- [x] **Test:** Each page shows empty state when no data

---

## M11 — Data Export/Import & Backup
*User data portability — export, import, automatic backups.*

### Export
- [x] Implement JSON export with all user data
- [x] Implement CSV export with date range filter
- [x] Implement selective export (by category, date range)
- [x] Add export progress indicator
- [x] **Test:** Export → file downloads with correct data

### Import
- [x] Implement JSON import with validation
- [x] Implement CSV import with column mapping
- [x] Add conflict resolution (skip, overwrite, merge)
- [x] Add import preview before committing
- [x] **Test:** Import JSON → data appears
- [x] **Test:** Import CSV → data appears
- [x] **Test:** Import with conflicts → resolution dialog

### Backup
- [x] Implement automatic weekly backup to Supabase storage
- [x] Implement manual backup trigger
- [x] Implement restore from backup with preview
- [x] Add backup list with timestamps
- [x] **Test:** Backup created → stored in Supabase
- [x] **Test:** Restore from backup → data restored

---

## M12 — Internationalization (i18n)
*Multi-language support foundation with RTL readiness.*

### i18n Setup
- [x] Set up react-i18next
- [x] Extract all user-facing strings into translation files
- [x] Add language detection (browser locale, user preference)
- [x] **Test:** Language switcher works

### Translations
- [x] Implement English (en) translations
- [x] Implement Spanish (es) translations
- [x] Implement French (fr) translations
- [x] **Test:** All pages render in each language

### RTL Support
- [x] Add RTL stylesheet preparation
- [x] Test with RTL placeholder
- [x] **Test:** RTL layout works correctly

---

## M13 — Monitoring & Error Tracking
*Real-user monitoring, error tracking, performance observability.*

### Error Tracking
- [x] Set up Sentry for web error tracking
- [x] Add source maps to Sentry
- [x] Implement error grouping
- [x] **Test:** Errors captured in Sentry

### Performance Monitoring
- [x] Add Core Web Vitals collection (LCP, INP, CLS)
- [x] Add custom performance metrics
- [x] Add API call timing instrumentation
- [x] **Test:** Performance metrics collected

### Health Check
- [x] Implement client-side health check
- [x] Add API reachable check
- [x] Add auth valid check
- [x] Add DB responsive check
- [x] **Test:** Health check runs on app load

---

## M14 — E2E Testing: Web (Playwright)
*Comprehensive browser automation for critical user journeys.*

### Infrastructure
- [x] Set up Playwright config + CI (Chromium, Firefox, WebKit)
- [x] Set up test data seeding
- [x] Set up video recording on failure
- [x] Set up retry logic
- [x] Set up accessibility assertion (aXe) in every test

### Test Scenarios (20+)
- [x] **Auth flow:** Login with Google OAuth → redirect to main page
- [x] **Daily block creation:** Add block via form → verify on dial
- [x] **Drag-to-place:** Click and drag on dial → block appears at correct time
- [x] **Drag-to-move:** Move existing block → position updates correctly
- [x] **Resize block:** Drag block edge → duration changes
- [x] **Delete block:** Delete a block → it disappears from dial
- [x] **Archive/Restore:** Archive block → verify in archive → restore
- [x] **Day navigation:** Go to yesterday → go back to today → blocks load
- [x] **Complete day:** Mark day complete → streak increments → verify persistence
- [x] **Recurring rules:** Create a rule → verify generated blocks on future days
- [x] **Edit recurring rule:** Change rule time → generated blocks update
- [x] **Delete recurring rule:** Delete rule with option to keep/delete blocks
- [x] **Settings:** Change sleep schedule → sleep block updates on dial
- [x] **Theme toggle:** Switch to dark mode → verify CSS variables applied
- [x] **Analytics:** View analytics with date range → verify chart data accuracy
- [x] **Archive filters:** Filter by category → only matching blocks shown
- [x] **PDF export:** Generate PDF → file downloads with correct content
- [x] **Data export/import:** Export → re-import → verify data integrity
- [x] **Offline mode:** Go offline → create block → come online → sync
- [x] **Keyboard navigation:** Tab through all interactive elements → verify focus order
- [x] **Error state:** Revoke auth token → verify redirect to login + clear message
- [x] **Mobile responsive:** All pages at 375px viewport — layout adapts correctly
- [x] **Lock/unlock:** Lock block → verify can't move → unlock → verify can move
- [x] **Concurrent tasks:** 2+ tasks → progress indicator appears
- [x] **Polish:** Visual regression baseline screenshots for key pages

---

## M15 — E2E Testing: Mobile Web & PWA
*End-to-end testing across mobile browsers, PWA install, offline flows.*

### Infrastructure
- [x] Set up Playwright mobile device emulation (iPhone, Pixel, Galaxy)
- [x] Configure CI for mobile WebKit and Chromium device profiles

### Test Scenarios (20+)
- [x] **PWA install:** Install prompt appears → installs → launches standalone
- [x] **Offline block creation:** Go offline → create block → service worker serves app
- [x] **Offline sync:** Go online → queued mutations sync to server
- [x] **Touch drag-to-place:** Touch dial → block appears at correct time
- [x] **Touch drag-to-move:** Touch block → move to new position
- [x] **Swipe day navigation:** Swipe left/right → navigate days
- [x] **Pull-to-refresh:** Pull down → blocks reload
- [x] **Bottom sheet:** Block form opens as bottom sheet on mobile
- [x] **Responsive layout:** 320px, 375px, 414px, 768px — layout adapts
- [x] **Safe area:** Notch phones → safe-area-inset respected
- [x] **Notifications:** Permission prompt → accept → subscription
- [x] **Push notification:** Click → navigates to correct page
- [x] **Dark mode:** Persists across PWA relaunch
- [x] **Analytics:** Charts render on mobile (no overflow)
- [x] **Date picker:** Touch interaction works on mobile
- [x] **Long-press:** Context menu appears on block
- [x] **Reduced motion:** Respects prefers-reduced-motion
- [x] **Slow network:** Loading states appear correctly
- [x] **Lock/unlock:** Lock block → verify touch locked
- [x] **Concurrent tasks:** 2+ tasks → indicator appears on mobile
- [x] **Polish:** BrowserStack manual test on 5 real mobile devices

---

## Milestone Summary

| # | Milestone | Track | Est. Effort |
|---|-----------|-------|-------------|
| M1 | Critical Bugs & Data Integrity Fixes | Backend | 1 week |
| M2 | Progress Bar for Concurrent Tasks | Web | 1 week |
| M3 | Lock/Unlock Tasks (Including Sleep) | Web | 1 week |
| M4 | Error Handling & User Feedback | Web | 1 week |
| M5 | Server & Infrastructure Hardening | Backend | 1 week |
| M6 | Design System & UI Polish | Web | 1 week |
| M7 | Accessibility Deep Dive | Web | 1 week |
| M8 | Mobile Touch & Gesture Polish | Web | 1 week |
| M9 | Analytics & Data Visualization | Web | 1.5 weeks |
| M10 | Onboarding & Empty States | Web | 1 week |
| M11 | Data Export/Import & Backup | Web | 1 week |
| M12 | Internationalization (i18n) | Web | 1 week |
| M13 | Monitoring & Error Tracking | Backend | 1 week |
| M14 | E2E Testing: Web (Playwright) | Testing | 2 weeks |
| M15 | E2E Testing: Mobile Web & PWA | Testing | 2 weeks |
| | **Total** | | **~18 weeks** |

> **Note:** Each milestone includes test and polish tasks for everything added.
> Minimum 20 E2E test scenarios are defined in M14 (web) and M15 (mobile web/PWA).
> All tasks have acceptance criteria and test cases.

---

## Current Status

> **Last updated:** All milestones complete (commit `a86185c`)
>
> ### Completed Milestones
> - [x] **M1 — Critical Bugs & Data Integrity** (125 unit tests passing)
> - [x] **M2 — Progress Bar for Concurrent Tasks**
> - [x] **M3 — Lock/Unlock Tasks**
> - [x] **M4 — Error Handling & User Feedback** (import JSON/CSV added)
> - [x] **M5 — Server Rewrite** (PWA manifest, service worker, Vite chunks)
> - [x] **M6 — Design System & UI Polish** (skeletons, button animation)
> - [x] **M7 — Accessibility** (focus trap, skip-link, keyboard shortcuts)
> - [x] **M8 — Mobile Touch & Gesture Polish** (swipe, haptic, safe-area)
> - [x] **M9 — Analytics** (trend, heatmap, cumulative, productivity score)
> - [x] **M10 — Onboarding & Empty States**
> - [x] **M11 — Data Export/Import** (JSON export/import, CSV export/import)
> - [x] **M12 — Internationalization** (react-i18next, en/es/fr)
> - [x] **M13 — Monitoring** (error capture, performance metrics, health check)
> - [x] **M14 — E2E Testing Setup** (Playwright, 51 scenarios)
> - [x] **M15 — Mobile E2E** (15 mobile-specific scenarios)
>
> ### Critical Fixes Applied
> - **Sync fix**: Removed `locked` from `blockToDb` — column may not exist in live DB
> - **Init race**: Init now directly awaits fetchBlocks, not taskQueue
>
> ### Before Next Deploy
> 1. Run `supabase/migration_m1.sql` in Supabase SQL Editor
> 2. Run `supabase/migration_security_fixes.sql` in Supabase SQL Editor
> 3. Enable leaked password protection in Dashboard → Authentication → Password Settings
> 4. Install Playwright browsers: `npx playwright install chromium`

## Quick Start

```
pnpm install
pnpm dev       # Web app at localhost:5173
pnpm test      # Run unit tests
pnpm build     # Production build
```

## Stack

- **Web:** React 18, Vite 6, React Router 7, Canvas 2D API, Recharts
- **Backend:** Supabase (Postgres, Auth, Edge Functions)
- **Testing:** Vitest, Playwright
- **CI/CD:** GitHub Actions

## License

MIT
