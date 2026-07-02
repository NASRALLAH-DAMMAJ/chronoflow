# ChronoFlow — MVP Roadmap

> Build: React 18 + Vite 6 + Canvas 2D + localStorage
> Principles: Simplicity > Features | Awareness > Productivity | History is the Product

## ✅ Done

- [x] 24h circular canvas dial with block arcs, hour ticks, labels
- [x] Add blocks (form: label, time range, category)
- [x] Delete blocks
- [x] Select blocks (dial + list highlight)
- [x] Drag-move blocks on dial (snap 15min)
- [x] Drag-resize blocks start/end (snap 15min)
- [x] Zoom dial (scroll/pinch + reset)
- [x] Current time indicator on dial
- [x] Dark/light theme toggle (system preference + localStorage)
- [x] Block list (sorted, colored, badge, duration)
- [x] Design tokens (color, typography, spacing, elevation, motion)
- [x] localStorage persistence per date
- [x] `goToDate` / `updateBlock` in store (no UI yet)

---

## 🎯 Milestone 1 — Core UX Polish (Hackathon Ready)

**Theme: Make it feel finished, not broken.**

- [ ] Edit blocks — inline edit label/category/time in BlockForm (use `updateBlock`)
- [ ] Empty state — nicer illustration when no blocks
- [ ] Block overlap validation — warn on save if block overlaps another
- [ ] Scrollable block list (max-height with overflow-y)
- [ ] Better form UX — time inputs default to reasonable values, keyboard shortcuts
- [ ] Responsive layout — stack dial above list on narrow screens
- [ ] Loading state — show spinner while localStorage reads (if slow)

---

## 🎯 Milestone 2 — Date Navigation & Archive

**Theme: Make yesterday and every day before it reachable.**

- [ ] Date picker / calendar nav in header (prev/next day, calendar popup)
- [ ] "Today" button to jump back
- [ ] Read-only past days (can view, cannot edit? or edit allowed?)
- [ ] Visual indicator if a day has no blocks yet
- [ ] Navigation keyboard shortcuts (← → for prev/next day)

---

## 🎯 Milestone 3 — Night Review / Logging Flow

**Theme: Close the loop between plan and reality.**

- [ ] "Review" mode toggle — switch from planning to actual logging
- [ ] Actual block overlay on dial (distinct visual, e.g. dashed outline)
- [ ] Quick-adjust: tap a planned block → adjust its actual time range
- [ ] Quality Index per block (1-5, simple emoji or dot rating)
- [ ] Night review summary card — total logged vs planned, gaps
- [ ] "Complete day" button — marks day as reviewed, stores completion timestamp
- [ ] Streak indicator — consecutive days reviewed

---

## 🎯 Milestone 4 — Hackathon Submission

**Theme: Ship it.**

- [ ] Onboarding — first-visit overlay: "Tap the dial to add a block"
- [ ] README.md — project description, screenshots, link to demo, tech stack
- [ ] Build optimization — code splitting if needed, verify build works
- [ ] Performance — ensure 60fps canvas on mid-range devices
- [ ] Accessibility — keyboard navigation, screen reader labels on dial
- [ ] Bug bash — test: empty day, full day, midnight-crossing blocks, 00:00–00:00
- [ ] Deploy — static build to Vercel / Netlify / GitHub Pages
- [ ] Devpost submission — write-up, demo video/gif, screenshots

---

## 📦 Future (Post-Hackathon)

- [ ] Weekly/Monthly heatmap view
- [ ] Pattern recognition (recurring activities, time spent trends)
- [ ] Multi-day block drag across dates
- [ ] Templates / presets
- [ ] Export (CSV, JSON, PDF)
- [ ] Sync / cloud backup
- [ ] Mobile PWA

---

## Guiding Rules

1. Does it make logging easier? → Yes → build
2. Does it improve time awareness? → Yes → build
3. Does it increase long-term value? → Yes → build
4. Can it be understood immediately? → No → simplify
5. Would removing it make the product worse? → No → don't build
