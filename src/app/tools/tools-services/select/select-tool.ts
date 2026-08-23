import { Node, KonvaEventObject } from "konva/lib/Node";
import { Shape } from "konva/lib/Shape";
import { Rect } from "konva/lib/shapes/Rect";
import { Transformer } from "konva/lib/shapes/Transformer";
import { Util } from "konva/lib/Util";
import { NodeState, nextNodeId } from "@/app/services";
import {
  DESELECT_EVENT,
  IToolContext,
  NS,
  ToolCleanup,
  relativePointer
} from "../context";

const NUDGE_COMMIT_MS = 400;

/**
 * Turns committed shapes back into objects: click or rubber-band to select,
 * drag to move, handles to scale/rotate, arrows to nudge, Delete to remove.
 */
export const attachSelectTool = (ctx: IToolContext): ToolCleanup => {
  const { stage, drawing, overlay } = ctx;

  const transformer = new Transformer({
    rotateAnchorOffset: 24,
    anchorSize: 9,
    anchorCornerRadius: 3,
    anchorStroke: "#6366f1",
    anchorFill: "#ffffff",
    borderStroke: "#6366f1",
    borderDash: [4, 4],
    padding: 4,
    ignoreStroke: true
  });
  const marquee = new Rect({
    fill: "rgba(99,102,241,0.12)",
    stroke: "#6366f1",
    strokeWidth: 1,
    dash: [4, 4],
    visible: false,
    listening: false
  });
  overlay.add(marquee);
  overlay.add(transformer);

  const setInteractive = (interactive: boolean) => {
    drawing.listening(interactive);
    drawing.getChildren().forEach((child) => {
      child.listening(interactive);
      (child as Shape).draggable(interactive);
    });
  };

  setInteractive(true);

  const select = (nodes: Node[]) => {
    transformer.nodes(nodes);
    overlay.batchDraw();
  };

  /* ------------------------------------------------------- move / resize */
  let before: { node: Node; before: NodeState }[] = [];

  const captureBefore = () => {
    before = transformer
      .nodes()
      .map((node) => ({ node, before: ctx.history.capture(node) }));
  };

  const commitBefore = () => {
    if (!before.length) return;
    ctx.history.modify(before);
    before = [];
  };

  /* --------------------------------------------------------- rubber band */
  let origin: { x: number; y: number } | null = null;

  const onPointerDown = (event: KonvaEventObject<PointerEvent>) => {
    if (ctx.isPanning()) return;
    const target = event.target;
    const additive = event.evt.shiftKey || event.evt.metaKey;

    if (target === stage) {
      if (!additive) select([]);
      origin = relativePointer(stage);
      marquee.setAttrs({ ...origin, width: 0, height: 0, visible: true });
      overlay.batchDraw();
      return;
    }
    if (target.getParent() === transformer) return;

    const current = transformer.nodes();
    if (additive) {
      select(
        current.includes(target)
          ? current.filter((node) => node !== target)
          : [...current, target]
      );
    } else if (!current.includes(target)) {
      select([target]);
    }
  };

  const onPointerMove = () => {
    if (!origin) return;
    const pos = relativePointer(stage);
    marquee.setAttrs({
      x: Math.min(origin.x, pos.x),
      y: Math.min(origin.y, pos.y),
      width: Math.abs(pos.x - origin.x),
      height: Math.abs(pos.y - origin.y)
    });
    overlay.batchDraw();
  };

  const onPointerUp = () => {
    if (!origin) return;
    origin = null;

    const box = marquee.getClientRect();
    marquee.visible(false);
    overlay.batchDraw();
    if (box.width < 4 && box.height < 4) return;

    const hits = drawing
      .getChildren()
      .filter((node) => Util.haveIntersection(box, node.getClientRect()));
    select(hits);
    if (hits.length) ctx.notify(`${hits.length} selected`);
  };

  /* ------------------------------------------------------------ keyboard */
  let nudgeBefore: { node: Node; before: NodeState }[] = [];
  let nudgeTimer: ReturnType<typeof setTimeout> | null = null;

  const commitNudge = () => {
    if (nudgeTimer) clearTimeout(nudgeTimer);
    nudgeTimer = null;
    if (!nudgeBefore.length) return;
    ctx.history.modify(nudgeBefore);
    nudgeBefore = [];
  };

  const nudge = (dx: number, dy: number) => {
    const nodes = transformer.nodes();
    if (!nodes.length) return;
    if (!nudgeBefore.length) {
      nudgeBefore = nodes.map((node) => ({
        node,
        before: ctx.history.capture(node)
      }));
    }
    nodes.forEach((node) => node.move({ x: dx, y: dy }));
    drawing.batchDraw();
    overlay.batchDraw();
    if (nudgeTimer) clearTimeout(nudgeTimer);
    nudgeTimer = setTimeout(commitNudge, NUDGE_COMMIT_MS);
  };

  const onKeyDown = (event: KeyboardEvent) => {
    const target = event.target as HTMLElement | null;
    if (target && ["INPUT", "TEXTAREA"].includes(target.tagName)) return;

    const mod = event.metaKey || event.ctrlKey;

    if (mod && event.key.toLowerCase() === "a") {
      event.preventDefault();
      select([...drawing.getChildren()]);
      return;
    }

    const nodes = transformer.nodes();
    if (!nodes.length) return;

    if (event.key === "Delete" || event.key === "Backspace") {
      event.preventDefault();
      commitNudge();
      select([]);
      ctx.history.remove(nodes);
      return;
    }

    if (mod && event.key.toLowerCase() === "d") {
      event.preventDefault();
      const clones = nodes.map((node) => {
        const clone = node.clone({
          id: nextNodeId(),
          x: node.x() + 16,
          y: node.y() + 16
        });
        drawing.add(clone as Shape);
        return clone;
      });
      select(clones);
      drawing.batchDraw();
      ctx.history.add(clones);
      return;
    }

    const step = event.shiftKey ? 10 : 1;
    const offsets: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step]
    };
    if (offsets[event.key]) {
      event.preventDefault();
      nudge(...offsets[event.key]);
      return;
    }

    if (event.key === "Escape") select([]);
  };

  const deselect = () => {
    commitNudge();
    select([]);
    setInteractive(true);
  };

  stage.on(`pointerdown${NS}`, onPointerDown);
  stage.on(`pointermove${NS}`, onPointerMove);
  stage.on(`pointerup${NS}`, onPointerUp);
  stage.on(`dragstart${NS}`, captureBefore);
  stage.on(`dragend${NS}`, commitBefore);
  stage.on(`transformstart${NS}`, captureBefore);
  stage.on(`transformend${NS}`, commitBefore);
  stage.on(`${DESELECT_EVENT}${NS}`, deselect);
  window.addEventListener("keydown", onKeyDown);

  return () => {
    commitNudge();
    stage.off(NS);
    window.removeEventListener("keydown", onKeyDown);
    transformer.destroy();
    marquee.destroy();
    setInteractive(false);
    overlay.batchDraw();
  };
};
