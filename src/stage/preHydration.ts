/**
 * Input made before hydration is kept (#708). The practice page is pre-rendered, so a student can
 * tap an option or type a digit a second or two before React attaches. Hydration then resets the
 * controlled inputs to the runner's (empty) state: the tick vanished and Check stayed off, with
 * no word why. Two parts, same rules as the resume marker: no request, fails silently.
 *
 * 1. `preInputScript`: a tiny inline script placed before the stage. Until hydration it records
 *    every `input` / `change` on the page (capture phase), latest value per element, on
 *    `window.__cetPreInput`. Element references, not selectors: hydration adopts the same nodes.
 * 2. `replayPreHydrationInputs()`: run by the runner in a layout effect on mount (the hydration
 *    commit, before paint). Each recorded value is put back through React's own change path, so
 *    the runner's state is what the student saw: the tick is back and Check turns on before the
 *    next frame. The record is then cleared and the listeners removed.
 */

export const PRE_INPUT_KEY = "__cetPreInput";

type Recorded = Map<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, string | boolean>;

declare global {
  interface Window {
    [PRE_INPUT_KEY]?: { map: Recorded; stop: () => void };
  }
}

/** The inline script. Runs once; a second copy (client navigation never renders it) is a no-op. */
export const preInputScript = `(function(){if(window.${PRE_INPUT_KEY})return;var m=new Map();function f(e){var t=e.target;if(!t||!("value"in t)||!t.type)return;m.delete(t);m.set(t,t.type==="radio"||t.type==="checkbox"?!!t.checked:String(t.value))}function s(){document.removeEventListener("input",f,true);document.removeEventListener("change",f,true)}document.addEventListener("input",f,true);document.addEventListener("change",f,true);window.${PRE_INPUT_KEY}={map:m,stop:s}})();`;

/** Sets a DOM value past React's value tracker, so the following event reads as a real change. */
function setNative(el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, prop: "value" | "checked", value: string | boolean) {
  const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : el instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, prop)?.set;
  if (setter) setter.call(el, value);
  else (el as unknown as Record<string, unknown>)[prop] = value;
}

/**
 * Puts every input recorded before hydration back through React's change handling. Returns how
 * many were replayed. Safe to call when nothing was recorded or the script never ran.
 */
export function replayPreHydrationInputs(): number {
  if (typeof window === "undefined") return 0;
  const pre = window[PRE_INPUT_KEY];
  if (!pre) return 0;
  pre.stop();
  delete window[PRE_INPUT_KEY];
  let n = 0;
  for (const [el, value] of pre.map) {
    if (!el.isConnected || (el as HTMLInputElement).disabled) continue;
    try {
      if (typeof value === "boolean") {
        if (!value) continue;
        // React may have reset it or left it: clear through the tracked property, then a real click checks it and fires change
        (el as HTMLInputElement).checked = false;
        (el as HTMLInputElement).click();
      } else {
        if (value === "") continue;
        // clear through the tracked property so the tracker holds "", then set the value past it: the input event is a change
        el.value = "";
        setNative(el, "value", value);
        el.dispatchEvent(new Event("input", { bubbles: true }));
      }
      n += 1;
    } catch {
      // one bad element never blocks the rest
    }
  }
  return n;
}
