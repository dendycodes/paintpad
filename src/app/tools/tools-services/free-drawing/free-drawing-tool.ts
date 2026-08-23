import { Line } from "konva/lib/shapes/Line";
import { KonvaEventObject } from "konva/lib/Node";
import { ToolId } from "@/app/interfaces";
import { nextNodeId, simplifyPoints } from "@/app/services";
import {
  CANCEL_EVENT,
  IToolContext,
  NS,
  ToolCleanup,
  isDrawingEvent,
  relativePointer
} from "../context";

type FreehandVariant = Extract<
  ToolId,
  "pencil" | "marker" | "highlighter" | "eraser"
>;

const variantProps = (variant: FreehandVariant, ctx: IToolContext) => {
  const options = ctx.getOptions();
  switch (variant) {
    case "eraser":
      return {
        stroke: "#000000",
        opacity: 1,
        globalCompositeOperation: "destination-out" as GlobalCompositeOperation
      };
    case "highlighter":
      return {
        stroke: options.color,
        opacity: 0.38,
        globalCompositeOperation: "multiply" as GlobalCompositeOperation
      };
    default:
      return {
        stroke: options.color,
        opacity: options.opacity,
        globalCompositeOperation: "source-over" as GlobalCompositeOperation
      };
  }
};

/**
 * Freehand strokes for the pencil, marker, highlighter and eraser.
 *
 * The stroke in progress lives on the scratch layer so each pointer move only
 * repaints that one line instead of the whole drawing; it is moved across on
 * release. The eraser is the exception — it has to composite against the
 * artwork to show what it is removing, so it draws in place.
 */
export const attachFreeDrawing = (
  ctx: IToolContext,
  variant: FreehandVariant
): ToolCleanup => {
  const { stage } = ctx;
  const inPlace = variant === "eraser";
  const canvas = () => (inPlace ? ctx.drawing : ctx.live);

  let line: Line | null = null;
  let points: number[] = [];
  let last = { x: 0, y: 0 };

  const minDistance = () => 1.2 / (stage.scaleX() || 1);

  const discard = () => {
    line?.destroy();
    line = null;
    points = [];
    canvas().batchDraw();
  };

  const start = (event: KonvaEventObject<PointerEvent>) => {
    if (!isDrawingEvent(ctx, event.evt)) return;
    event.evt.preventDefault?.();

    const pos = relativePointer(stage);
    last = pos;
    points = [pos.x, pos.y, pos.x, pos.y];
    line = new Line({
      ...variantProps(variant, ctx),
      id: nextNodeId(),
      strokeWidth: ctx.getSize(),
      lineCap: "round",
      lineJoin: "round",
      points,
      listening: false,
      perfectDrawEnabled: false,
      shadowForStrokeEnabled: false
    });
    canvas().add(line);
  };

  const move = () => {
    if (!line) return;
    const pos = relativePointer(stage);
    if (Math.hypot(pos.x - last.x, pos.y - last.y) < minDistance()) return;
    last = pos;
    points.push(pos.x, pos.y);
    line.points(points);
    canvas().batchDraw();
  };

  const end = () => {
    const finished = line;
    if (!finished) return;
    line = null;

    // A tap without movement should still leave a dot behind.
    if (points.length <= 4) {
      finished.points([points[0], points[1], points[0] + 0.01, points[1] + 0.01]);
    } else {
      finished.points(simplifyPoints(points, 0.6 / (stage.scaleX() || 1)));
    }
    points = [];

    if (!inPlace) {
      finished.moveTo(ctx.drawing);
      ctx.live.batchDraw();
    }
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
