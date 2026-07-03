# ChronoFlow v1 Test Plan

## 1. Build & Console
- [ ] `pnpm build` exits 0 with no warnings
- [ ] Dev server: no console errors on load
- [ ] No uncaught errors in any interaction

## 2. The Dial
- [ ] Renders 24h circle with hour ticks and labels
- [ ] Current time indicator shows at correct position
- [ ] Blocks render as colored arcs at correct positions
- [ ] Selected block has visual highlight on dial
- [ ] Drag-move block: arc follows pointer, snaps 15min
- [ ] Drag-resize: edge follows pointer, snaps 15min
- [ ] Cannot drag start past end or end before start
- [ ] Zoom: scroll zooms in/out centered on pointer
- [ ] Zoom: pinch to zoom on touch
- [ ] Zoom: indicator shows range; reset button works
- [ ] Blocks outside zoom range are hidden
- [ ] Tick density adapts to zoom level

## 3. Blocks (CRUD)
- [ ] Add block: form submits, block appears on dial + list
- [ ] Add block: validation prevents empty label
- [ ] Add block: validation prevents end ≤ start
- [ ] Add block: overlap warning shown correctly
- [ ] Edit block: form pre-fills with block data
- [ ] Edit block: changes reflect on dial + list
- [ ] Delete block: removed from dial + list
- [ ] Select block: highlights on dial + list; click again deselects
- [ ] Block list: sorted by start time
- [ ] Block list: scrollable when many blocks

## 4. Date Navigation
- [ ] Prev/next day buttons switch date
- [ ] Date picker switches to selected date
- [ ] "Today" button visible only when not on today
- [ ] Blocks persist per date in localStorage
- [ ] Navigating to a date with no blocks shows empty state

## 5. Night Review
- [ ] "Complete day" button visible on today if not completed
- [ ] Clicking "Complete day" marks it reviewed
- [ ] "Reviewed" badge shows on completed days
- [ ] Streak counter increments correctly
- [ ] Completed days persist across refresh

## 6. Theming
- [ ] Dark mode toggle works
- [ ] Dark mode persists across refresh
- [ ] Follows system preference on first visit
- [ ] All text is readable in both themes
- [ ] All block category colors are visible in both themes

## 7. Edge Cases
- [ ] Midnight-crossing block (e.g. 23:00–01:00)
- [ ] Block exactly 00:00–00:00 (0 duration → rejected)
- [ ] Block ending exactly at 24:00
- [ ] localStorage cleared → graceful fallback
- [ ] Rapid add/delete/edit
- [ ] Move block to edge of dial (0 and 1440 boundary)

## 8. Responsive & Layout
- [ ] Desktop: two-column grid (dial + sidebar)
- [ ] < 720px: single column, dial on top
- [ ] No horizontal scroll on narrow screens

## 9. Onboarding
- [ ] First visit: onboarding overlay shows
- [ ] Dismiss onboarding: overlay gone, localStorage set
- [ ] Second visit: no overlay

## 10. Accessibility
- [ ] Focus-visible outlines on all interactive elements
- [ ] Color not the only indicator (category labels on blocks)
