# ChronoFlow — GitHub Issues Tracker

> **Source of truth**: https://github.com/NASRALLAH-DAMMAJ/chronoflow/issues
> **Last synced**: 2026-07-03 (10 issues closed)
> **How to use**: When starting work on an issue, change `[ ]` to `[~]`. When done, change to `[x]`. Update `Completed` column with the commit hash or date.

---

## Bugs

| # | Status | Title | Priority | Files |
|---|--------|-------|----------|-------|
| [#1](https://github.com/NASRALLAH-DAMMAJ/chronoflow/issues/1) | [x] | innerR mismatch between hit detection and rendering | High | `useDialInteraction.js:97`, `DialCanvas.js:21`, `Dial.jsx:80` |
| [#2](https://github.com/NASRALLAH-DAMMAJ/chronoflow/issues/2) | [x] | Side effect in reducer — COMPLETE_DAY calls localStorage | High | `reducer.js:86` |
| [#3](https://github.com/NASRALLAH-DAMMAJ/chronoflow/issues/3) | [x] | Block ID collision risk after page reload | Medium | `App.jsx:145` |

## Accessibility

| # | Status | Title | Priority | Files |
|---|--------|-------|----------|-------|
| [#4](https://github.com/NASRALLAH-DAMMAJ/chronoflow/issues/4) | [ ] | Missing focus indicators and keyboard support | High | `App.jsx:60,247`, `BlockForm.jsx:60,95` |
| [#5](https://github.com/NASRALLAH-DAMMAJ/chronoflow/issues/5) | [x] | No aria-label on icon-only buttons | High | `App.jsx:84-262`, `Icon.jsx` |
| [#6](https://github.com/NASRALLAH-DAMMAJ/chronoflow/issues/6) | [ ] | No focus trap in Modal and Onboarding | High | `Modal.jsx`, `App.jsx:119-143` |
| [#7](https://github.com/NASRALLAH-DAMMAJ/chronoflow/issues/7) | [x] | Canvas has no ARIA role or label | High | `Dial.jsx:271` |
| [#8](https://github.com/NASRALLAH-DAMMAJ/chronoflow/issues/8) | [x] | TimeBar has no ARIA slider attributes | High | `TimeBar.jsx` |
| [#16](https://github.com/NASRALLAH-DAMMAJ/chronoflow/issues/16) | [ ] | CATEGORY_COLORS poor contrast on dark backgrounds | Medium | `constants.js:19-29` |

## Performance

| # | Status | Title | Priority | Files |
|---|--------|-------|----------|-------|
| [#13](https://github.com/NASRALLAH-DAMMAJ/chronoflow/issues/13) | [x] | Memoize Context value in StoreContext | High | `StoreContext.jsx:78-94` |
| [#20](https://github.com/NASRALLAH-DAMMAJ/chronoflow/issues/20) | [ ] | Cache getComputedStyle on canvas draw | Medium | `Dial.jsx:82-91` |

## Code Quality

| # | Status | Title | Priority | Files |
|---|--------|-------|----------|-------|
| [#10](https://github.com/NASRALLAH-DAMMAJ/chronoflow/issues/10) | [x] | Replace var with const/let in DialCanvas.js | Low | `DialCanvas.js` |
| [#11](https://github.com/NASRALLAH-DAMMAJ/chronoflow/issues/11) | [ ] | Extract duplicate utilities to shared modules | Medium | `App.jsx`, `Dial.jsx`, `DialCanvas.js`, `reducer.js`, `constants.js`, `useDialInteraction.js`, `TimeBar.jsx` |
| [#12](https://github.com/NASRALLAH-DAMMAJ/chronoflow/issues/12) | [x] | Remove dead files and unused exports | Low | `zoom.js`, `zoom-utils.js`, `design-system/` |
| [#14](https://github.com/NASRALLAH-DAMMAJ/chronoflow/issues/14) | [ ] | Remove 23 unused CSS custom properties | Low | `design-system/styles.css` |
| [#15](https://github.com/NASRALLAH-DAMMAJ/chronoflow/issues/15) | [x] | snapEnabled prop accepted but never passed | Low | `useDialInteraction.js:23`, `Dial.jsx:50-58` |

## UI / UX

| # | Status | Title | Priority | Files |
|---|--------|-------|----------|-------|
| [#9](https://github.com/NASRALLAH-DAMMAJ/chronoflow/issues/9) | [ ] | Theme inconsistencies — onboarding overlay, TimeBar handle | Medium | `App.jsx:124`, `TimeBar.jsx:108,113` |
| [#19](https://github.com/NASRALLAH-DAMMAJ/chronoflow/issues/19) | [ ] | Missing responsive styles for mobile | Medium | `index.css`, `App.jsx`, `TimeBar.jsx` |

## Testing

| # | Status | Title | Priority | Files |
|---|--------|-------|----------|-------|
| [#17](https://github.com/NASRALLAH-DAMMAJ/chronoflow/issues/17) | [ ] | Add test suite with vitest | High | `package.json`, `vite.config.js`, new test files |

## Tooling

| # | Status | Title | Priority | Files |
|---|--------|-------|----------|-------|
| [#18](https://github.com/NASRALLAH-DAMMAJ/chronoflow/issues/18) | [ ] | Add ESLint, Prettier, and editorconfig | Medium | New config files, `package.json` |

---

## Legend

| Symbol | Meaning |
|--------|---------|
| `[ ]` | Not started |
| `[~]` | In progress |
| `[x]` | Done — completed |

## Priority Breakdown

- **High (10)**: #1, #2, #4, #5, #6, #7, #8, #13, #17
- **Medium (7)**: #3, #9, #11, #16, #18, #19, #20
- **Low (3)**: #10, #12, #14, #15

## Suggested Work Order

### Quick Wins (low effort, high impact)
1. #13 — Memoize Context value (1 line change)
2. #10 — var → const/let (find & replace)
3. #15 — Remove dead snapEnabled prop
4. #12 — Delete zoom.js dead file

### Bugs First
5. #1 — innerR mismatch (sync 0.6 → 0.55)
6. #2 — Move side effect out of reducer
7. #3 — Use crypto.randomUUID() for block IDs

### Accessibility Bundle
8. #4 — Add focus indicators to inputs
9. #5 — Add aria-labels to icon buttons
10. #7 — Add ARIA to canvas
11. #8 — Add ARIA slider to TimeBar
12. #6 — Add focus trap to Modal/Onboarding
13. #16 — Fix category color contrast

### Code Quality
14. #11 — Extract duplicate utilities to src/utils/
15. #14 — Remove unused CSS custom properties
16. #9 — Fix theme inconsistencies
17. #19 — Add missing responsive styles
18. #20 — Cache getComputedStyle

### Infrastructure
19. #18 — Add ESLint + Prettier
20. #17 — Add vitest + test suite
