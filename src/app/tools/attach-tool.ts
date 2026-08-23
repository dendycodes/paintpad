import { ToolId } from "../interfaces";
import { tools } from "./tools";
import { IToolContext, ToolCleanup } from "./tools-services/context";
import { attachFreeDrawing } from "./tools-services/free-drawing/free-drawing-tool";
import { attachShapeTool } from "./tools-services/shape/shape-tool";
import { attachTextTool } from "./tools-services/text/text-tool";
import { attachSelectTool } from "./tools-services/select/select-tool";
import { attachPanTool } from "./tools-services/pan/pan-tool";
import { attachEyedropper } from "./tools-services/eyedropper/eyedropper-tool";

/** Wires the active tool to the stage and hands back its teardown. */
export const attachTool = (id: ToolId, ctx: IToolContext): ToolCleanup => {
  ctx.stage.container().style.cursor = tools[id].cursor;

  switch (id) {
    case "pencil":
    case "marker":
    case "highlighter":
    case "eraser":
      return attachFreeDrawing(ctx, id);
    case "line":
    case "arrow":
    case "rect":
    case "ellipse":
      return attachShapeTool(ctx, id);
    case "text":
      return attachTextTool(ctx);
    case "select":
      return attachSelectTool(ctx);
    case "pan":
      return attachPanTool(ctx);
    case "eyedropper":
      return attachEyedropper(ctx);
    default:
      return () => undefined;
  }
};
