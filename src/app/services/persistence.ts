const STORAGE_KEY = "paintpad:drawing:v1";
const STORAGE_META = "paintpad:meta:v1";

export interface IStoredMeta {
  background: string;
  savedAt: number;
}

type IdleWindow = Window & {
  requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
};

const whenIdle = (task: () => void) => {
  const idle = (window as IdleWindow).requestIdleCallback;
  if (idle) idle(task, { timeout: 500 });
  else setTimeout(task, 0);
};

let timer: ReturnType<typeof setTimeout> | null = null;
let pending: (() => void) | null = null;

/**
 * Debounced, idle-scheduled autosave. The snapshot is produced lazily so a
 * burst of strokes only serialises the canvas once, off the drawing path.
 */
export const saveDrawing = (
  getSnapshot: () => string,
  background: string,
  delay = 600
) => {
  if (typeof window === "undefined") return;
  if (timer) clearTimeout(timer);

  pending = () => {
    pending = null;
    try {
      window.localStorage.setItem(STORAGE_KEY, getSnapshot());
      window.localStorage.setItem(
        STORAGE_META,
        JSON.stringify({ background, savedAt: Date.now() })
      );
    } catch {
      /* quota exceeded - autosave is a convenience, never a hard failure */
    }
  };

  timer = setTimeout(() => {
    timer = null;
    const task = pending;
    if (task) whenIdle(() => task());
  }, delay);
};

/** Write immediately — used when the tab is about to go away. */
export const flushSave = () => {
  if (timer) clearTimeout(timer);
  timer = null;
  pending?.();
};

export const loadDrawing = (): string | null => {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
};

export const saveBackground = (background: string) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      STORAGE_META,
      JSON.stringify({ background, savedAt: Date.now() })
    );
  } catch {
    /* ignore */
  }
};

export const loadMeta = (): IStoredMeta | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_META);
    return raw ? (JSON.parse(raw) as IStoredMeta) : null;
  } catch {
    return null;
  }
};

export const clearStoredDrawing = () => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    window.localStorage.removeItem(STORAGE_META);
  } catch {
    /* ignore */
  }
};
