import { Shape } from "konva/lib/Shape";
import { Arrow } from "konva/lib/shapes/Arrow";
import { Ellipse } from "konva/lib/shapes/Ellipse";
import { Line } from "konva/lib/shapes/Line";
import { Rect } from "konva/lib/shapes/Rect";
import { KonvaEventObject } from "konva/lib/Node";
import { ToolId } from "@/app/interfaces";
import { nextNodeId } from "@/app/services";
import {
  CANCEL_EVENT,
  IToolContext,
  NS,
  ToolCleanup,
  commonShapeProps,
  isDrawingEvent,
  relativePointer,
  snapAngle
} from "../context";

type ShapeVariant = Extract<ToolId, "line" | "arrow" | "rect" | "ellipse">;

const MIN_SIZE = 2;

/**
 * Click-drag shapes. Shift constrains the geometry (square / circle / 15 degree
 * angles) and Alt draws boxes and ellipses out from their centre.
 */
export const attachShapeTool = (
  ctx: IToolContext,
  variant: ShapeVariant
): ToolCleanup => {
  const { stage } = ctx;
  let node: Shape | null = null;
  let origin = { x: 0, y: 0 };

  const strokeProps = () => {
    const options = ctx.getOptions();
    return {
      ...commonShapeProps(ctx),
      id: nextNodeId(),
      stroke: options.color,
      strokeWidth: ctx.getSize(),
      lineCap: "round" as const,
      lineJoin: "round" as const,
      fill: options.filled ? options.fillColor : undefined
    };
  };

  const start = (event: KonvaEventObject<PointerEvent>) => {
    if (!isDrawingEvent(ctx, event.evt)) return;
    event.evt.preventDefault?.();
    origin = relativePointer(stage);

    switch (variant) {
      case "line":
        node = new Line({
          ...strokeProps(),
          fill: undefined,
          points: [origin.x, origin.y, origin.x, origin.y]
        });
        break;
      case "arrow":
        node = new Arrow({
          ...strokeProps(),
          fill: ctx.getOptions().color,
          pointerLength: Math.max(8, ctx.getSize() * 3),
          pointerWidth: Math.max(8, ctx.getSize() * 3),
          points: [origin.x, origin.y, origin.x, origin.y]
        });
        break;
      case "rect":
        node = new Rect({
          ...strokeProps(),
          x: origin.x,
          y: origin.y,
          width: 0,
          height: 0,
          cornerRadius: Math.min(6, ctx.getSize() * 2)
        });
        break;
      default:
        node = new Ellipse({
          ...strokeProps(),
          x: origin.x,
          y: origin.y,
          radiusX: 0,
          radiusY: 0
        });
        break;
    }

    ctx.live.add(node);
  };

  const move = (event: KonvaEventObject<PointerEvent>) => {
    if (!node) return;
    const pos = relativePointer(stage);
    const shift = event.evt.shiftKey;
    const fromCenter = event.evt.altKey;

    let dx = pos.x - origin.x;
    let dy = pos.y - origin.y;

    if (variant === "line" || variant === "arrow") {
      if (shift) ({ x: dx, y: dy } = snapAngle(dx, dy));
      (node as Line).points([origin.x, origin.y, origin.x + dx, origin.y + dy]);
    } else {
      if (shift) {
        const side = Math.max(Math.abs(dx), Math.abs(dy));
        dx = Math.sign(dx) * side || side;
        dy = Math.sign(dy) * side || side;
      }
      if (variant === "rect") {
        const rect = node as Rect;
        if (fromCenter) {
          rect.position({ x: origin.x - dx, y: origin.y - dy });
          rect.size({ width: dx * 2, height: dy * 2 });
        } else {
          rect.position({ x: Math.min(origin.x, origin.x + dx), y: Math.min(origin.y, origin.y + dy) });
          rect.size({ width: Math.abs(dx), height: Math.abs(dy) });
        }
      } else {
        const ellipse = node as Ellipse;
        if (fromCenter) {
          ellipse.position(origin);
          ellipse.radiusX(Math.abs(dx));
          ellipse.radiusY(Math.abs(dy));
        } else {
          ellipse.position({ x: origin.x + dx / 2, y: origin.y + dy / 2 });
          ellipse.radiusX(Math.abs(dx) / 2);
          ellipse.radiusY(Math.abs(dy) / 2);
        }
      }
    }

    ctx.live.batchDraw();
  };

  const discard = () => {
    node?.destroy();
    node = null;
    ctx.live.batchDraw();
  };

  const end = () => {
    const finished = node;
    if (!finished) return;
    node = null;

    const box = finished.getClientRect({ skipTransform: false });
    if (box.width < MIN_SIZE && box.height < MIN_SIZE) {
      finished.destroy();
      ctx.live.batchDraw();
      return;
    }

    finished.moveTo(ctx.drawing);
    ctx.live.batchDraw();
    ctx.drawing.batchDraw();
    ctx.history.add([finished]);
  };

  stage.on(`pointerdown${NS}`, start);
  stage.on(`pointermove${NS}`, move);
  stage.on(`pointerup${NS}`, end);
  stage.on(`${CANCEL_EVENT}${NS}`, discard);
  window.addEventListener("pointerup", end);

  return () => {
    stage.off(NS);
    window.removeEventListener("pointerup", end);
    discard();
  };
};
