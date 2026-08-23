import { useEffect, useRef, useState } from "react";
import { Layer } from "konva/lib/Layer";
import { Stage } from "konva/lib/Stage";
import { BackgroundKind } from "../interfaces";
import {
  DRAWING_LAYER_ID,
  LIVE_LAYER_ID,
  OVERLAY_LAYER_ID,
  backgrounds,
  loadDrawing,
  loadMeta,
  restoreDrawing
} from "../services";

interface IUseStageArgs {
  onPaperRestored: (kind: BackgroundKind) => void;
}

/**
 * Owns the Konva stage and its three layers:
 *   drawing — committed artwork
 *   live    — the shape currently under the cursor
 *   overlay — selection handles and other chrome
 */
export const useStage = ({ onPaperRestored }: IUseStageArgs) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Stage | null>(null);
  const drawingRef = useRef<Layer | null>(null);
  const liveRef = useRef<Layer | null>(null);
  const overlayRef = useRef<Layer | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const stage = new Stage({
      container,
      width: container.clientWidth,
      height: container.clientHeight
    });

    const drawing = new Layer({ id: DRAWING_LAYER_ID, listening: false });
    const live = new Layer({ id: LIVE_LAYER_ID, listening: false });
    const overlay = new Layer({ id: OVERLAY_LAYER_ID });
    stage.add(drawing);
    stage.add(live);
    stage.add(overlay);

    container.style.touchAction = "none";
    stageRef.current = stage;
    drawingRef.current = drawing;
    liveRef.current = live;
    overlayRef.current = overlay;

    const meta = loadMeta();
    if (meta?.background && meta.background in backgrounds) {
      onPaperRestored(meta.background as BackgroundKind);
    }

    const saved = loadDrawing();
    if (saved) {
      try {
        drawing.destroy();
        drawingRef.current = restoreDrawing(stage, saved);
      } catch {
        stage.add(drawing);
        drawing.moveToBottom();
        drawingRef.current = drawing;
      }
    }

    const resize = () => {
      stage.width(container.clientWidth);
      stage.height(container.clientHeight);
      stage.batchDraw();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(container);

    setReady(true);

    return () => {
      observer.disconnect();
      stage.destroy();
      stageRef.current = null;
      setReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { containerRef, stageRef, drawingRef, liveRef, overlayRef, ready };
};
