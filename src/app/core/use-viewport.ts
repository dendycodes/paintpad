import { MutableRefObject, useCallback, useEffect, useRef } from "react";
import { Layer } from "konva/lib/Layer";
import { Stage } from "konva/lib/Stage";
import { BackgroundKind, ToolId } from "../interfaces";
import { CANCEL_EVENT } from "../tools";
import { tools } from "../tools/tools";
import { applyPaper, fitToContent, resetView, zoomAt } from "../services";

interface IUseViewportArgs {
  containerRef: MutableRefObject<HTMLDivElement | null>;
  stageRef: MutableRefObject<Stage | null>;
  drawingRef: MutableRefObject<Layer | null>;
  paperRef: MutableRefObject<HTMLDivElement | null>;
  backgroundRef: MutableRefObject<BackgroundKind>;
  activeToolRef: MutableRefObject<ToolId>;
  ready: boolean;
  onZoomChange: (percent: number) => void;
}

/**
 * Everything that moves the camera. The paper is written straight to the DOM
 * and React only hears about the zoom level when the rounded percentage
 * actually changes, so panning costs zero renders.
 */
export const useViewport = ({
  containerRef,
  stageRef,
  drawingRef,
  paperRef,
  backgroundRef,
  activeToolRef,
  ready,
  onZoomChange
}: IUseViewportArgs) => {
  const panningRef = useRef(false);
  const pinchingRef = useRef(false);
  const lastPercentRef = useRef(-1);

  const isPanning = useCallback(
    () => panningRef.current || pinchingRef.current,
    []
  );

  const sync = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const zoom = stage.scaleX() || 1;

    if (paperRef.current) {
      applyPaper(paperRef.current, backgroundRef.current, zoom, stage.x(), stage.y());
    }

    const percent = Math.round(zoom * 100);
    if (percent !== lastPercentRef.current) {
      lastPercentRef.current = percent;
      onZoomChange(percent);
    }
  }, [stageRef, paperRef, backgroundRef, onZoomChange]);

  const cancelGesture = useCallback(() => {
    stageRef.current?.fire(CANCEL_EVENT);
  }, [stageRef]);

  /* ------------------------------------------------------------- wheel */
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !ready) return undefined;

    const onWheel = (event: WheelEvent) => {
      const stage = stageRef.current;
      if (!stage) return;
      event.preventDefault();

      const pointer = stage.getPointerPosition() ?? {
        x: stage.width() / 2,
        y: stage.height() / 2
      };

      if (event.ctrlKey || event.metaKey) {
        zoomAt(stage, (stage.scaleX() || 1) * Math.exp(-event.deltaY / 220), pointer);
      } else {
        const dx = event.shiftKey ? -(event.deltaX || event.deltaY) : -event.deltaX;
        const dy = event.shiftKey ? 0 : -event.deltaY;
        stage.position({ x: stage.x() + dx, y: stage.y() + dy });
        stage.batchDraw();
      }
      sync();
    };

    container.addEventListener("wheel", onWheel, { passive: false });
    return () => container.removeEventListener("wheel", onWheel);
  }, [containerRef, stageRef, ready, sync]);

  /* ------------------------------------------ space bar / middle button */
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !ready) return undefined;

    let spaceDown = false;
    let dragging = false;

    const beginPan = () => {
      const stage = stageRef.current;
      if (!stage || panningRef.current) return;
      panningRef.current = true;
      cancelGesture();
      stage.draggable(true);
      container.style.cursor = "grab";
    };

    const endPan = () => {
      const stage = stageRef.current;
      if (!stage || !panningRef.current) return;
      panningRef.current = false;
      stage.draggable(activeToolRef.current === "pan");
      container.style.cursor = tools[activeToolRef.current].cursor;
    };

    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA"].includes(target.tagName)) return;
      if (event.code !== "Space" || spaceDown) return;
      spaceDown = true;
      event.preventDefault();
      beginPan();
    };

    const onKeyUp = (event: KeyboardEvent) => {
      if (event.code !== "Space") return;
      spaceDown = false;
      if (!dragging) endPan();
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 1) return;
      event.preventDefault();
      dragging = true;
      beginPan();
    };

    const onPointerUp = () => {
      dragging = false;
      if (!spaceDown) endPan();
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    container.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointerup", onPointerUp);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      container.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [containerRef, stageRef, activeToolRef, ready, cancelGesture]);

  /* ------------------------------------------------- two finger gestures */
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !ready) return undefined;

    let lastDistance = 0;
    let lastCenter = { x: 0, y: 0 };

    const centerOf = (touches: TouchList) => {
      const rect = container.getBoundingClientRect();
      return {
        x: (touches[0].clientX + touches[1].clientX) / 2 - rect.left,
        y: (touches[0].clientY + touches[1].clientY) / 2 - rect.top
      };
    };

    const distanceOf = (touches: TouchList) =>
      Math.hypot(
        touches[0].clientX - touches[1].clientX,
        touches[0].clientY - touches[1].clientY
      );

    const onTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 2) return;
      pinchingRef.current = true;
      cancelGesture();
      lastDistance = distanceOf(event.touches);
      lastCenter = centerOf(event.touches);
    };

    const onTouchMove = (event: TouchEvent) => {
      if (!pinchingRef.current || event.touches.length !== 2) return;
      const stage = stageRef.current;
      if (!stage) return;
      event.preventDefault();

      const distance = distanceOf(event.touches);
      const center = centerOf(event.touches);
      if (lastDistance > 0) {
        zoomAt(stage, (stage.scaleX() || 1) * (distance / lastDistance), center);
      }
      stage.position({
        x: stage.x() + (center.x - lastCenter.x),
        y: stage.y() + (center.y - lastCenter.y)
      });
      stage.batchDraw();

      lastDistance = distance;
      lastCenter = center;
      sync();
    };

    const onTouchEnd = (event: TouchEvent) => {
      if (event.touches.length >= 2) return;
      pinchingRef.current = false;
      lastDistance = 0;
    };

    container.addEventListener("touchstart", onTouchStart, { passive: false });
    container.addEventListener("touchmove", onTouchMove, { passive: false });
    container.addEventListener("touchend", onTouchEnd);
    container.addEventListener("touchcancel", onTouchEnd);

    return () => {
      container.removeEventListener("touchstart", onTouchStart);
      container.removeEventListener("touchmove", onTouchMove);
      container.removeEventListener("touchend", onTouchEnd);
      container.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [containerRef, stageRef, ready, sync, cancelGesture]);

  /* ------------------------------------------- stage drag (pan tool etc) */
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || !ready) return undefined;
    stage.on("dragmove.viewport", sync);
    return () => {
      stage.off("dragmove.viewport");
    };
  }, [stageRef, ready, sync]);

  const zoomBy = useCallback(
    (factor: number) => {
      const stage = stageRef.current;
      if (!stage) return;
      zoomAt(stage, (stage.scaleX() || 1) * factor, {
        x: stage.width() / 2,
        y: stage.height() / 2
      });
      sync();
    },
    [stageRef, sync]
  );

  const resetZoom = useCallback(() => {
    if (!stageRef.current) return;
    resetView(stageRef.current);
    sync();
  }, [stageRef, sync]);

  const fitDrawing = useCallback(() => {
    const stage = stageRef.current;
    const drawing = drawingRef.current;
    if (!stage || !drawing) return;
    fitToContent(stage, drawing);
    sync();
  }, [stageRef, drawingRef, sync]);

  return { isPanning, sync, zoomBy, resetZoom, fitDrawing };
};
