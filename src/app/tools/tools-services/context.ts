import { Layer } from "konva/lib/Layer";
import { Node } from "konva/lib/Node";
import { Stage } from "konva/lib/Stage";
import { IDrawingOptions, ToolId } from "@/app/interfaces";
import { NodeState } from "@/app/services";

export const NS = ".paintpad";
/** Fired on the stage when a gesture (pinch, tool switch) invalidates the
 *  stroke that is currently being drawn. */
export const CANCEL_EVENT = "paintpadcancel";
/** Fired on the stage when the current selection is no longer valid. */
export const DESELECT_EVENT = "paintpaddeselect";

export interface IHistoryApi {
  /** Record nodes that were just added to the drawing layer. */
  add: (nodes: Node[]) => void;
  /** Record and destroy nodes. */
  remove: (nodes: Node[]) => void;
  /** Record a move/resize/rotate, given the state captured before it started. */
  modify: (records: { node: Node; before: NodeState }[]) => void;
  capture: (node: Node) => NodeState;
}

export interface IToolContext {
  stage: Stage;
  /** committed artwork */
  drawing: Layer;
  /** scratch layer for the shape currently under the cursor */
  live: Layer;
  /** selection handles and other chrome */
  overlay: Layer;
  /** Read through a getter so changing a slider never re-binds the tool. */
  getOptions: () => IDrawingOptions;
  getSize: () => number;
  getPaperColor: () => string;
  getPreviousTool: () => ToolId;
  history: IHistoryApi;
  setColor: (hex: string) => void;
  selectTool: (id: ToolId) => void;
  notify: (message: string) => void;
  /** true while a pan or pinch gesture owns the pointer */
  isPanning: () => boolean;
}

export type ToolCleanup = () => void;

/** Ignore right clicks and pointer input that belongs to the pan gesture. */
export const isDrawingEvent = (
  ctx: IToolContext,
  evt: MouseEvent | TouchEvent | PointerEvent
) => {
  if (ctx.isPanning()) return false;
  const mouse = evt as MouseEvent;
  if (typeof mouse.button === "number" && mouse.button !== 0) return false;
  return true;
};

export const relativePointer = (stage: Stage) => {
  const pos = stage.getRelativePointerPosition();
  return pos ?? { x: 0, y: 0 };
};

/** Snap a vector to the nearest 15 degree increment (Shift on shape tools). */
export const snapAngle = (dx: number, dy: number) => {
  const length = Math.hypot(dx, dy);
  const step = Math.PI / 12;
  const angle = Math.round(Math.atan2(dy, dx) / step) * step;
  return { x: Math.cos(angle) * length, y: Math.sin(angle) * length };
};

export const commonShapeProps = (ctx: IToolContext) => ({
  listening: false,
  perfectDrawEnabled: false,
  shadowForStrokeEnabled: false,
  opacity: ctx.getOptions().opacity
});
