/**
 * Safe browser storage (ADR-0005). Every call is wrapped; when storage is unavailable
 * (private mode, quota, SSR) the app keeps working with an in-memory fallback.
 */
const memory = new Map<string, string>();

function ls(): Storage | null {
  try {
    if (typeof window === "undefined") return null;
    const s = window.localStorage;
    const probe = "__cet_probe__";
    s.setItem(probe, "1");
    s.removeItem(probe);
    return s;
  } catch {
    return null;
  }
}

export function readJSON<T>(key: string): T | null {
  try {
    const raw = ls()?.getItem(key) ?? memory.get(key) ?? null;
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function writeJSON(key: string, value: unknown): boolean {
  const raw = JSON.stringify(value);
  memory.set(key, raw);
  try {
    const s = ls();
    if (!s) return false;
    s.setItem(key, raw);
    return true;
  } catch {
    return false;
  }
}

export function removeKey(key: string): void {
  memory.delete(key);
  try {
    ls()?.removeItem(key);
  } catch {
    /* ignore */
  }
}

export function keysWithPrefix(prefix: string): string[] {
  const out = new Set<string>();
  for (const k of memory.keys()) if (k.startsWith(prefix)) out.add(k);
  try {
    const s = ls();
    if (s) for (let i = 0; i < s.length; i++) {
      const k = s.key(i);
      if (k && k.startsWith(prefix)) out.add(k);
    }
  } catch {
    /* ignore */
  }
  return [...out];
}

/** Test hook: clears the in-memory fallback. */
export function _resetMemory(): void {
  memory.clear();
}
