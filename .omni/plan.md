# PaintPad: performance pass + UX/architecture improvements

## Performance
- [x] 1. Live preview layer — in-progress strokes/shapes stop forcing a full redraw of the artwork
- [x] 2. Replace snapshot undo/redo with delta history (add/remove/modify) — O(1) commits, no full re-serialise
- [x] 3. Stop re-attaching tools on every option change (tools read options through getters)
- [x] 4. Imperative viewport: paper + brush cursor updated via rAF/DOM instead of React state per pointer event
- [x] 5. Stroke point simplification (RDP) + no per-move array concat
- [x] 6. Autosave on idle, only when the drawing actually changed

## UX
- [x] 7. Rubber-band selection, Ctrl+A, arrow-key nudge, selection survives option changes
- [x] 8. Touch pinch-zoom / two-finger pan, with in-progress stroke cancellation
- [x] 9. Empty-canvas hint, no context menu on canvas, no long-press callout

## Structure
- [x] 10. Split core into use-stage / use-viewport / use-shortcuts hooks
- [x] 11. Typecheck, lint, build, browser-verify (incl. a scripted perf measurement before/after)
