import { KonvaEventObject } from "konva/lib/Node";
import { IToolContext, NS, ToolCleanup } from "../context";

const toHex = (value: number) => value.toString(16).padStart(2, "0");

/**
 * Samples the pixel under the cursor straight from the drawing layer, falling
 * back to the paper colour wherever the canvas is still transparent.
 */
export const attachEyedropper = (ctx: IToolContext): ToolCleanup => {
  const { stage, drawing } = ctx;

  const pick = (event: KonvaEventObject<PointerEvent>) => {
    if (ctx.isPanning()) return;
    event.evt.preventDefault?.();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const canvas = drawing.getCanvas();
    const ratio = canvas.getPixelRatio();
    const context2d = canvas.getContext()._context;

    try {
      const pixel = context2d.getImageData(
        Math.round(pointer.x * ratio),
        Math.round(pointer.y * ratio),
        1,
        1
      ).data;
      const hex =
        pixel[3] < 12
          ? ctx.getPaperColor()
          : `#${toHex(pixel[0])}${toHex(pixel[1])}${toHex(pixel[2])}`;
      ctx.setColor(hex);
      ctx.notify(`Picked ${hex.toUpperCase()}`);
    } catch {
      ctx.notify("Could not read that pixel");
    }

    ctx.selectTool(ctx.getPreviousTool());
  };

  stage.on(`pointerdown${NS}`, pick);

  return () => {
    stage.off(NS);
  };
};
