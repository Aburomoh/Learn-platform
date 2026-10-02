# DragToTarget

Native drag-to-target primitive (ADR-0004). No library.

```tsx
<DragToTarget id="bits" items={[{ id: "one", label: "1", reusable: true }]}
  targets={slots.map((s) => ({ id: `slot-${s.place}`, label: `${s.place} slot`, itemId: s.bit ? "one" : null }))}
  onPlace={(item, target) => setBit(target, 1)} onRemove={(target) => setBit(target, 0)}
  renderTarget={(t, status) => <Slot place={...} status={status} />} />
```

- **Pointer / touch:** press an item, move, release over a target (`touch-action: none` on items,
  pointer capture, `elementFromPoint` hit-testing). A ghost follows the pointer.
- **Keyboard:** focus an item, Space/Enter grabs, Arrow/Home/End move the cursor across targets,
  Space/Enter places, Escape or Tab cancels. A polite live region announces each step.
- **Tap fallback:** with an item grabbed, activating a target places it. Activating a filled target
  calls `onRemove`.
- **Reduced motion:** the only transitions are colour, which collapse via tokens.
- Targets expose `data-drop-target`; use `renderTarget` to add `data-focus-target` for the tutor.
