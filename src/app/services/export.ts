import { Layer } from "konva/lib/Layer";
import { Rect } from "konva/lib/shapes/Rect";
import { Stage } from "konva/lib/Stage";
import { IExportOptions } from "../interfaces";

const PADDING = 40;

interface IRenderArgs {
  stage: Stage;
  drawing: Layer;
  paperColor: string;
  transparent: boolean;
  scale: number;
  mimeType: string;
}

/**
 * Renders the artwork at 1:1 regardless of the current zoom/pan, cropped to
 * whatever has actually been drawn (plus a little breathing room).
 */
const renderDataURL = ({
  stage,
  drawing,
  paperColor,
  transparent,
  scale,
  mimeType
}: IRenderArgs): string => {
  const prevScale = stage.scale() ?? { x: 1, y: 1 };
  const prevPosition = stage.position();

  stage.scale({ x: 1, y: 1 });
  stage.position({ x: 0, y: 0 });

  const content = drawing.getClientRect({ skipTransform: false });
  const hasContent = content.width > 0 && content.height > 0;

  const box = hasContent
    ? {
        x: content.x - PADDING,
        y: content.y - PADDING,
        width: content.width + PADDING * 2,
        height: content.height + PADDING * 2
      }
    : { x: 0, y: 0, width: stage.width(), height: stage.height() };

  let paperLayer: Layer | null = null;
  if (!transparent) {
    paperLayer = new Layer({ listening: false });
    paperLayer.add(new Rect({ ...box, fill: paperColor }));
    stage.add(paperLayer);
    paperLayer.moveToBottom();
  }

  const url = stage.toDataURL({ ...box, pixelRatio: scale, mimeType });

  paperLayer?.destroy();
  stage.scale(prevScale);
  stage.position(prevPosition);
  stage.batchDraw();

  return url;
};

export const exportStage = (
  stage: Stage,
  drawing: Layer,
  paperColor: string,
  options: IExportOptions
) => {
  const transparent = options.transparent && options.format === "png";
  const url = renderDataURL({
    stage,
    drawing,
    paperColor,
    transparent,
    scale: options.scale,
    mimeType: options.format === "png" ? "image/png" : "image/jpeg"
  });

  const link = document.createElement("a");
  link.href = url;
  link.download = `paintpad-${new Date()
    .toISOString()
    .slice(0, 19)
    .replace(/[:T]/g, "-")}.${options.format === "png" ? "png" : "jpg"}`;
  link.click();
};

export const copyStageToClipboard = async (
  stage: Stage,
  drawing: Layer,
  paperColor: string
): Promise<boolean> => {
  const url = renderDataURL({
    stage,
    drawing,
    paperColor,
    transparent: false,
    scale: 2,
    mimeType: "image/png"
  });

  try {
    const blob = await (await fetch(url)).blob();
    const clipboard = navigator.clipboard as Clipboard & {
      write?: (items: ClipboardItem[]) => Promise<void>;
    };
    if (!clipboard?.write || typeof ClipboardItem === "undefined") return false;
    await clipboard.write([new ClipboardItem({ "image/png": blob })]);
    return true;
  } catch {
    return false;
  }
};
