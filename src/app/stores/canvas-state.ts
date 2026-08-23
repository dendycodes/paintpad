import { atom } from "recoil";
import { BackgroundKind, ToolId } from "../interfaces";

export const activeToolState = atom<ToolId>({
  key: "activeToolState",
  default: "pencil"
});

export const backgroundState = atom<BackgroundKind>({
  key: "backgroundState",
  default: "grid"
});

/** Zoom as a whole percentage. Panning never touches React state at all. */
export const zoomState = atom<number>({
  key: "zoomState",
  default: 100
});

export const canvasEmptyState = atom<boolean>({
  key: "canvasEmptyState",
  default: true
});

export const historyState = atom({
  key: "historyState",
  default: { canUndo: false, canRedo: false }
});

export const toastState = atom<string | null>({
  key: "toastState",
  default: null
});

export const shortcutsOpenState = atom<boolean>({
  key: "shortcutsOpenState",
  default: false
});
