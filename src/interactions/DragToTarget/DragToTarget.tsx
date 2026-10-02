"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import styles from "./DragToTarget.module.css";

export interface DragItem {
  id: string;
  label: string;
  /** A reusable item stays in the tray after being placed (e.g. an endless supply of "1"). */
  reusable?: boolean;
}

export interface DropTarget {
  id: string;
  /** Accessible name announced while moving with the keyboard. */
  label: string;
  /** Item currently placed here, if any. */
  itemId?: string | null;
}

export interface DragToTargetProps {
  id: string;
  items: DragItem[];
  targets: DropTarget[];
  onPlace: (itemId: string, targetId: string) => void;
  /** Tapping or activating a filled target removes its item. */
  onRemove?: (targetId: string) => void;
  disabled?: boolean;
  /** Custom rendering of a target's content (default: the placed item label or empty). */
  renderTarget?: (target: DropTarget, status: TargetStatus) => ReactNode;
  trayLabel?: string;
  className?: string;
}

export interface TargetStatus {
  /** A drag or keyboard grab is in progress and this target can accept the item. */
  canDrop: boolean;
  /** The pointer is over, or the keyboard cursor is on, this target. */
  over: boolean;
}

interface Grab {
  itemId: string;
  mode: "pointer" | "keyboard";
  /** Keyboard cursor: index into `targets`. */
  cursor: number;
  /** Pointer position for the ghost. */
  x: number;
  y: number;
  overTargetId: string | null;
}

/**
 * Native drag-to-target (ADR-0004). Pointer: press on an item, move, release over a target.
 * Keyboard: focus an item, Space/Enter grabs it, arrows move between targets, Space/Enter
 * places, Escape cancels. Touch uses the same pointer path. Reduced motion: no ghost
 * transition, targets change colour instantly.
 */
export function DragToTarget({
  id,
  items,
  targets,
  onPlace,
  onRemove,
  disabled = false,
  renderTarget,
  trayLabel = "Pieces",
  className = "",
}: DragToTargetProps) {
  const [grab, setGrab] = useState<Grab | null>(null);
  const [announce, setAnnounce] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const placedElsewhere = (itemId: string) => targets.some((t) => t.itemId === itemId);
  const available = items.filter((i) => i.reusable || !placedElsewhere(i.id));

  const finish = useCallback(
    (targetId: string | null) => {
      setGrab((g) => {
        if (!g) return null;
        if (targetId) {
          onPlace(g.itemId, targetId);
          const t = targets.find((x) => x.id === targetId);
          setAnnounce(`Placed ${itemLabel(items, g.itemId)} in ${t?.label ?? targetId}.`);
        } else {
          setAnnounce("Cancelled.");
        }
        return null;
      });
    },
    [items, onPlace, targets],
  );

  /* ---------- pointer path ---------- */
  function onPointerDown(e: PointerEvent<HTMLButtonElement>, itemId: string) {
    if (disabled || e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setGrab({ itemId, mode: "pointer", cursor: -1, x: e.clientX, y: e.clientY, overTargetId: null });
  }
  function onPointerMove(e: PointerEvent<HTMLButtonElement>) {
    if (!grab || grab.mode !== "pointer") return;
    const over = targetAt(e.clientX, e.clientY, rootRef.current);
    setGrab({ ...grab, x: e.clientX, y: e.clientY, overTargetId: over });
  }
  function onPointerUp(e: PointerEvent<HTMLButtonElement>) {
    if (!grab || grab.mode !== "pointer") return;
    e.currentTarget.releasePointerCapture(e.pointerId);
    finish(targetAt(e.clientX, e.clientY, rootRef.current));
  }

  /* ---------- keyboard path ---------- */
  function onItemKeyDown(e: KeyboardEvent<HTMLButtonElement>, itemId: string) {
    if (disabled) return;
    if (!grab && (e.key === " " || e.key === "Enter")) {
      e.preventDefault();
      const cursor = Math.max(0, targets.findIndex((t) => !t.itemId));
      setGrab({ itemId, mode: "keyboard", cursor, x: 0, y: 0, overTargetId: targets[cursor]?.id ?? null });
      setAnnounce(`Grabbed ${itemLabel(items, itemId)}. Use arrow keys to choose a slot, then press Enter. Press Escape to cancel. Now on ${targets[cursor]?.label ?? "no slot"}.`);
      return;
    }
    if (!grab || grab.mode !== "keyboard") return;
    const step = (d: number) => {
      const cursor = (grab.cursor + d + targets.length) % targets.length;
      setGrab({ ...grab, cursor, overTargetId: targets[cursor].id });
      setAnnounce(targets[cursor].label + (targets[cursor].itemId ? " (filled)" : ""));
    };
    switch (e.key) {
      case "ArrowRight":
      case "ArrowDown":
        e.preventDefault();
        step(1);
        break;
      case "ArrowLeft":
      case "ArrowUp":
        e.preventDefault();
        step(-1);
        break;
      case "Home":
        e.preventDefault();
        setGrab({ ...grab, cursor: 0, overTargetId: targets[0].id });
        break;
      case "End":
        e.preventDefault();
        setGrab({ ...grab, cursor: targets.length - 1, overTargetId: targets[targets.length - 1].id });
        break;
      case " ":
      case "Enter":
        e.preventDefault();
        finish(targets[grab.cursor]?.id ?? null);
        break;
      case "Escape":
        e.preventDefault();
        finish(null);
        break;
      case "Tab":
        finish(null);
        break;
    }
  }

  /* Tap-to-place fallback: with an item grabbed (keyboard mode), activating a target places it. */
  function onTargetActivate(t: DropTarget) {
    if (disabled) return;
    if (grab) {
      finish(t.id);
      return;
    }
    if (t.itemId && onRemove) {
      onRemove(t.id);
      setAnnounce(`Removed from ${t.label}.`);
    }
  }

  // Safety: cancel a pointer grab if the pointer is lost (e.g. alt-tab mid-drag).
  useEffect(() => {
    if (!grab || grab.mode !== "pointer") return;
    const cancel = () => setGrab(null);
    window.addEventListener("pointercancel", cancel);
    window.addEventListener("blur", cancel);
    return () => {
      window.removeEventListener("pointercancel", cancel);
      window.removeEventListener("blur", cancel);
    };
  }, [grab]);

  return (
    <div ref={rootRef} className={`${styles.root} ${className}`} data-drag-root={id}>
      <div className={styles.targets} data-testid={`${id}-targets`}>
        {targets.map((t, i) => {
          const over = grab?.overTargetId === t.id || (grab?.mode === "keyboard" && grab.cursor === i);
          const status: TargetStatus = { canDrop: !!grab, over };
          return (
            <div
              key={t.id}
              data-drop-target={t.id}
              className={`${styles.target} ${grab ? styles.canDrop : ""} ${over ? styles.over : ""} ${t.itemId ? styles.filled : ""}`}
              onClick={() => onTargetActivate(t)}
              role={t.itemId && onRemove ? "button" : undefined}
              tabIndex={t.itemId && onRemove && !disabled ? 0 : undefined}
              aria-label={t.itemId && onRemove ? `${t.label}: ${itemLabel(items, t.itemId)}. Activate to remove.` : undefined}
              onKeyDown={(e) => {
                if ((e.key === "Enter" || e.key === " ") && t.itemId && onRemove) {
                  e.preventDefault();
                  onTargetActivate(t);
                }
              }}
            >
              {renderTarget ? renderTarget(t, status) : <span>{t.itemId ? itemLabel(items, t.itemId) : ""}</span>}
            </div>
          );
        })}
      </div>

      <div className={styles.tray} role="group" aria-label={trayLabel}>
        {available.map((item) => (
          <button
            key={item.id}
            ref={(el) => {
              itemRefs.current[item.id] = el;
            }}
            type="button"
            className={`${styles.item} ${grab?.itemId === item.id ? styles.grabbed : ""}`}
            disabled={disabled}
            aria-pressed={grab?.itemId === item.id || undefined}
            aria-describedby={`${id}-drag-help`}
            onPointerDown={(e) => onPointerDown(e, item.id)}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onKeyDown={(e) => onItemKeyDown(e, item.id)}
          >
            {item.label}
          </button>
        ))}
        <span id={`${id}-drag-help`} className="sr-only">
          Drag onto a slot, or press Space to pick up and use arrow keys to choose a slot.
        </span>
      </div>

      {grab?.mode === "pointer" && (
        <div className={styles.ghost} style={{ transform: `translate(${grab.x}px, ${grab.y}px)` }} aria-hidden="true">
          {itemLabel(items, grab.itemId)}
        </div>
      )}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {announce}
      </div>
    </div>
  );
}

function itemLabel(items: DragItem[], id: string): string {
  return items.find((i) => i.id === id)?.label ?? id;
}

function targetAt(x: number, y: number, root: HTMLElement | null): string | null {
  if (typeof document === "undefined" || !root) return null;
  const el = document.elementFromPoint(x, y);
  const target = el?.closest<HTMLElement>("[data-drop-target]");
  if (!target || !root.contains(target)) return null;
  return target.dataset.dropTarget ?? null;
}
