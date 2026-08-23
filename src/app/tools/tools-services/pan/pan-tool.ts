import { IToolContext, NS, ToolCleanup } from "../context";

/** Dedicated pan tool — the stage itself becomes draggable. */
export const attachPanTool = (ctx: IToolContext): ToolCleanup => {
  const { stage } = ctx;

  stage.draggable(true);
  stage.on(`dragstart${NS}`, () => {
    stage.container().style.cursor = "grabbing";
  });
  stage.on(`dragend${NS}`, () => {
    stage.container().style.cursor = "grab";
  });

  return () => {
    stage.off(NS);
    stage.draggable(false);
  };
};
