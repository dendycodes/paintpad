import { ITool, ToolId } from "../interfaces";

const caps = (
  overrides: Partial<ITool["supports"]> = {}
): ITool["supports"] => ({
  size: false,
  color: false,
  opacity: false,
  fill: false,
  fontSize: false,
  ...overrides
});

export const tools: Record<ToolId, ITool> = {
  select: {
    id: "select",
    label: "Select",
    hint: "Click or drag a box around shapes to move, resize and rotate them.",
    cursor: "default",
    shortcut: "V",
    group: "navigate",
    defaultSize: 2,
    supports: caps()
  },
  pan: {
    id: "pan",
    label: "Pan",
    hint: "Drag to move around the canvas. Hold Space with any tool for the same.",
    cursor: "grab",
    shortcut: "H",
    group: "navigate",
    defaultSize: 2,
    supports: caps()
  },
  pencil: {
    id: "pencil",
    label: "Pencil",
    hint: "Thin freehand strokes.",
    cursor: "none",
    shortcut: "P",
    group: "draw",
    defaultSize: 3,
    supports: caps({ size: true, color: true, opacity: true })
  },
  marker: {
    id: "marker",
    label: "Marker",
    hint: "Bold freehand strokes.",
    cursor: "none",
    shortcut: "M",
    group: "draw",
    defaultSize: 12,
    supports: caps({ size: true, color: true, opacity: true })
  },
  highlighter: {
    id: "highlighter",
    label: "Highlighter",
    hint: "Translucent chisel strokes that stack like a real highlighter.",
    cursor: "none",
    shortcut: "G",
    group: "draw",
    defaultSize: 24,
    supports: caps({ size: true, color: true })
  },
  eraser: {
    id: "eraser",
    label: "Eraser",
    hint: "Rub out anything you have drawn.",
    cursor: "none",
    shortcut: "E",
    group: "draw",
    defaultSize: 24,
    supports: caps({ size: true })
  },
  line: {
    id: "line",
    label: "Line",
    hint: "Drag for a straight line. Hold Shift to snap to 15° angles.",
    cursor: "crosshair",
    shortcut: "L",
    group: "shape",
    defaultSize: 3,
    supports: caps({ size: true, color: true, opacity: true })
  },
  arrow: {
    id: "arrow",
    label: "Arrow",
    hint: "Drag to point at something. Hold Shift to snap to 15° angles.",
    cursor: "crosshair",
    shortcut: "A",
    group: "shape",
    defaultSize: 3,
    supports: caps({ size: true, color: true, opacity: true })
  },
  rect: {
    id: "rect",
    label: "Rectangle",
    hint: "Drag out a rectangle. Hold Shift for a perfect square.",
    cursor: "crosshair",
    shortcut: "R",
    group: "shape",
    defaultSize: 3,
    supports: caps({ size: true, color: true, opacity: true, fill: true })
  },
  ellipse: {
    id: "ellipse",
    label: "Ellipse",
    hint: "Drag out an ellipse. Hold Shift for a perfect circle.",
    cursor: "crosshair",
    shortcut: "O",
    group: "shape",
    defaultSize: 3,
    supports: caps({ size: true, color: true, opacity: true, fill: true })
  },
  text: {
    id: "text",
    label: "Text",
    hint: "Click anywhere and type. Escape or a click outside commits it.",
    cursor: "text",
    shortcut: "T",
    group: "content",
    defaultSize: 3,
    supports: caps({ color: true, opacity: true, fontSize: true })
  },
  eyedropper: {
    id: "eyedropper",
    label: "Eyedropper",
    hint: "Pick any colour already on the canvas.",
    cursor: "copy",
    shortcut: "I",
    group: "content",
    defaultSize: 2,
    supports: caps()
  }
};

export const toolList: ITool[] = Object.values(tools);

export const toolOrder: ToolId[] = [
  "select",
  "pan",
  "pencil",
  "marker",
  "highlighter",
  "eraser",
  "line",
  "arrow",
  "rect",
  "ellipse",
  "text",
  "eyedropper"
];

export const toolByShortcut = (key: string): ITool | undefined =>
  toolList.find((tool) => tool.shortcut.toLowerCase() === key.toLowerCase());

export const defaultSizes = toolList.reduce((acc, tool) => {
  acc[tool.id] = tool.defaultSize;
  return acc;
}, {} as Record<ToolId, number>);
