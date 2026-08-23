import { atom, selector } from "recoil";
import { IDrawingOptions } from "../interfaces";
import { defaultSizes } from "../tools/tools";

export const PALETTE = [
  "#111827",
  "#6b7280",
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#22c55e",
  "#14b8a6",
  "#3b82f6",
  "#6366f1",
  "#a855f7",
  "#ec4899",
  "#ffffff"
];

export const drawingOptionsState = atom<IDrawingOptions>({
  key: "drawingOptionsState",
  default: {
    color: "#3b82f6",
    fillColor: "#3b82f6",
    filled: false,
    opacity: 1,
    fontSize: 28,
    sizeByTool: { ...defaultSizes },
    recentColors: []
  }
});

export const activeSizeSelector = selector({
  key: "activeSizeSelector",
  get: ({ get }) => get(drawingOptionsState).sizeByTool
});
