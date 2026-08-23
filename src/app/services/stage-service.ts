import { Layer } from "konva/lib/Layer";
import { Node } from "konva/lib/Node";
import { Stage } from "konva/lib/Stage";
import { Image as KonvaImage } from "konva/lib/shapes/Image";
import { nextNodeId } from "./history";
// Deep imports register the shape classes so Node.create() can rebuild them.
import "konva/lib/shapes/Line";
import "konva/lib/shapes/Rect";
import "konva/lib/shapes/Ellipse";
import "konva/lib/shapes/Arrow";
import "konva/lib/shapes/Text";

export const MIN_ZOOM = 0.15;
export const MAX_ZOOM = 8;
export const DRAWING_LAYER_ID = "mainLayer";
export const LIVE_LAYER_ID = "liveLayer";
export const OVERLAY_LAYER_ID = "overlayLayer";

export const clampZoom = (zoom: number) =>
  Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));

export const snapshotOf = (layer: Layer) => layer.toJSON();

/** Konva drops the HTMLImageElement on serialise, so re-attach it by data URL. */
const rehydrateImages = (layer: Layer) => {
  layer.find("Image").forEach((node) => {
    const src = node.getAttr("src");
    if (typeof src !== "string" || !src) return;
    const image = new window.Image();
    image.onload = () => {
      (node as KonvaImage).image(image);
      layer.batchDraw();
    };
    image.src = src;
  });
};

export const restoreDrawing = (stage: Stage, json: string): Layer => {
  stage.findOne<Layer>(`#${DRAWING_LAYER_ID}`)?.destroy();

  const layer = Node.create(json) as Layer;
  layer.id(DRAWING_LAYER_ID);
  layer.listening(false);
  // Drawings saved before ids existed still need one for delta history.
  layer.getChildren().forEach((child) => {
    if (!child.id()) child.id(nextNodeId());
  });
  stage.add(layer);
  layer.moveToBottom();
  rehydrateImages(layer);
  layer.batchDraw();
  return layer;
};

export const zoomAt = (
  stage: Stage,
  nextZoom: number,
  focus: { x: number; y: number }
) => {
  const oldZoom = stage.scaleX() || 1;
  const zoom = clampZoom(nextZoom);
  if (zoom === oldZoom) return;

  const origin = {
    x: (focus.x - stage.x()) / oldZoom,
    y: (focus.y - stage.y()) / oldZoom
  };

  stage.scale({ x: zoom, y: zoom });
  stage.position({
    x: focus.x - origin.x * zoom,
    y: focus.y - origin.y * zoom
  });
  stage.batchDraw();
};

export const resetView = (stage: Stage) => {
  stage.scale({ x: 1, y: 1 });
  stage.position({ x: 0, y: 0 });
  stage.batchDraw();
};

/** Zoom/centre so everything drawn fits comfortably in the viewport. */
export const fitToContent = (stage: Stage, drawing: Layer) => {
  const box = drawing.getClientRect({ skipTransform: true });
  if (!box.width || !box.height) {
    resetView(stage);
    return;
  }
  const padding = 80;
  const zoom = clampZoom(
    Math.min(
      (stage.width() - padding * 2) / box.width,
      (stage.height() - padding * 2) / box.height,
      2
    )
  );
  stage.scale({ x: zoom, y: zoom });
  stage.position({
    x: stage.width() / 2 - (box.x + box.width / 2) * zoom,
    y: stage.height() / 2 - (box.y + box.height / 2) * zoom
  });
  stage.batchDraw();
};

interface IPlaceImageArgs {
  stage: Stage;
  drawing: Layer;
  dataUrl: string;
  /** drop point in screen coordinates relative to the stage container */
  at?: { x: number; y: number } | null;
}

export const placeImage = ({
  stage,
  drawing,
  dataUrl,
  at
}: IPlaceImageArgs): Promise<KonvaImage> =>
  new Promise((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => {
      const zoom = stage.scaleX() || 1;
      const maxSide = Math.min(stage.width(), stage.height()) / zoom / 1.4;
      const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
      const width = image.width * scale;
      const height = image.height * scale;

      const screen = at ?? { x: stage.width() / 2, y: stage.height() / 2 };
      const point = {
        x: (screen.x - stage.x()) / zoom,
        y: (screen.y - stage.y()) / zoom
      };

      const node = new KonvaImage({
        id: nextNodeId(),
        image,
        src: dataUrl,
        x: point.x - width / 2,
        y: point.y - height / 2,
        width,
        height,
        listening: false,
        perfectDrawEnabled: false
      });
      drawing.add(node);
      drawing.batchDraw();
      resolve(node);
    };
    image.onerror = () => reject(new Error("Unsupported image"));
    image.src = dataUrl;
  });

export const readFileAsDataURL = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
