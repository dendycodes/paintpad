import { Layer } from "konva/lib/Layer";
import { Node } from "konva/lib/Node";
import { Shape } from "konva/lib/Shape";
import { Image as KonvaImage } from "konva/lib/shapes/Image";

const HISTORY_LIMIT = 200;

/** Attributes that describe where/how a node sits, captured through getters so
 *  defaults are recorded explicitly and an undo can always put them back. */
const STATE_KEYS = [
  "x",
  "y",
  "scaleX",
  "scaleY",
  "rotation",
  "skewX",
  "skewY",
  "offsetX",
  "offsetY",
  "width",
  "height",
  "radiusX",
  "radiusY",
  "points"
] as const;

export type NodeState = Record<string, unknown>;

export interface ISerializedNode {
  id: string;
  index: number;
  json: string;
}

export type HistoryEntry =
  | { kind: "add"; nodes: ISerializedNode[] }
  | { kind: "remove"; nodes: ISerializedNode[] }
  | {
      kind: "modify";
      changes: { id: string; before: NodeState; after: NodeState }[];
    };

let counter = 0;
export const nextNodeId = () =>
  `n${Date.now().toString(36)}${(counter++).toString(36)}`;

export const captureState = (node: Node): NodeState => {
  const state: NodeState = {};
  STATE_KEYS.forEach((key) => {
    const getter = (node as unknown as Record<string, unknown>)[key];
    if (typeof getter !== "function") return;
    const value = (getter as () => unknown).call(node);
    if (value === undefined) return;
    state[key] = Array.isArray(value) ? [...value] : value;
  });
  return state;
};

export const serializeNode = (node: Node): ISerializedNode => ({
  id: node.id(),
  index: node.zIndex(),
  json: node.toJSON()
});

const findById = (layer: Layer, id: string) =>
  layer.getChildren().find((child) => child.id() === id);

const rehydrate = (layer: Layer, node: Node) => {
  if (node.getClassName() !== "Image") return;
  const src = node.getAttr("src");
  if (typeof src !== "string" || !src) return;
  const image = new window.Image();
  image.onload = () => {
    (node as KonvaImage).image(image);
    layer.batchDraw();
  };
  image.src = src;
};

const restoreNodes = (layer: Layer, nodes: ISerializedNode[]) => {
  [...nodes]
    .sort((a, b) => a.index - b.index)
    .forEach((entry) => {
      const node = Node.create(entry.json) as Shape;
      layer.add(node);
      node.zIndex(Math.min(entry.index, layer.getChildren().length - 1));
      rehydrate(layer, node);
    });
};

const destroyNodes = (layer: Layer, nodes: ISerializedNode[]) => {
  nodes.forEach((entry) => findById(layer, entry.id)?.destroy());
};

const applyState = (
  layer: Layer,
  changes: { id: string; before: NodeState; after: NodeState }[],
  direction: "before" | "after"
) => {
  changes.forEach((change) => {
    findById(layer, change.id)?.setAttrs(change[direction]);
  });
};

/** Applies one entry forwards (redo) or backwards (undo). */
export const applyHistoryEntry = (
  layer: Layer,
  entry: HistoryEntry,
  invert: boolean
) => {
  switch (entry.kind) {
    case "add":
      if (invert) destroyNodes(layer, entry.nodes);
      else restoreNodes(layer, entry.nodes);
      break;
    case "remove":
      if (invert) restoreNodes(layer, entry.nodes);
      else destroyNodes(layer, entry.nodes);
      break;
    case "modify":
      applyState(layer, entry.changes, invert ? "before" : "after");
      break;
  }
  layer.batchDraw();
};

type Listener = () => void;

/**
 * Delta based undo/redo. Each entry only describes what changed, so committing
 * a stroke costs one small serialisation instead of a copy of the whole canvas.
 */
export class HistoryManager {
  private entries: HistoryEntry[] = [];
  private index = -1;
  private listeners = new Set<Listener>();

  reset() {
    this.entries = [];
    this.index = -1;
    this.emit();
  }

  push(entry: HistoryEntry) {
    this.entries = this.entries.slice(0, this.index + 1);
    this.entries.push(entry);
    if (this.entries.length > HISTORY_LIMIT) this.entries.shift();
    this.index = this.entries.length - 1;
    this.emit();
  }

  undo(): HistoryEntry | null {
    if (!this.canUndo) return null;
    const entry = this.entries[this.index];
    this.index -= 1;
    this.emit();
    return entry;
  }

  redo(): HistoryEntry | null {
    if (!this.canRedo) return null;
    this.index += 1;
    this.emit();
    return this.entries[this.index];
  }

  get canUndo() {
    return this.index >= 0;
  }

  get canRedo() {
    return this.index < this.entries.length - 1;
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit() {
    this.listeners.forEach((listener) => listener());
  }
}
