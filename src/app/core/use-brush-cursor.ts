import { MutableRefObject, useCallback, useEffect, useRef } from "react";
import { Stage } from "konva/lib/Stage";
import { BackgroundKind, IDrawingOptions, ToolId } from "../interfaces";
import { backgrounds } from "../services";
import { tools } from "../tools/tools";

interface IUseBrushCursorArgs {
  containerRef: MutableRefObject<HTMLDivElement | null>;
  brushRef: MutableRefObject<HTMLDivElement | null>;
  stageRef: MutableRefObject<Stage | null>;
  activeToolRef: MutableRefObject<ToolId>;
  optionsRef: MutableRefObject<IDrawingOptions>;
  backgroundRef: MutableRefObject<BackgroundKind>;
  ready: boolean;
}

/**
 * A live preview of the brush footprint, painted straight onto a single DOM
 * node inside a rAF so pointer movement never triggers a React render.
 */
export const useBrushCursor = ({
  containerRef,
  brushRef,
  stageRef,
  activeToolRef,
  optionsRef,
  backgroundRef,
  ready
}: IUseBrushCursorArgs) => {
  const point = useRef<{ x: number; y: number } | null>(null);
  const frame = useRef<number | null>(null);

  const paint = useCallback(() => {
    frame.current = null;
    const element = brushRef.current;
    if (!element) return;

    const tool = tools[activeToolRef.current];
    const position = point.current;
    if (!position || tool.cursor !== "none") {
      element.style.opacity = "0";
      return;
    }

    const options = optionsRef.current;
    const zoom = stageRef.current?.scaleX() || 1;
    const size = Math.max(
      6,
      (options.sizeByTool[tool.id] ?? tool.defaultSize) * zoom
    );
    const eraser = tool.id === "eraser";

    element.style.width = `${size}px`;
    element.style.height = `${size}px`;
    element.style.transform = `translate3d(${position.x - size / 2}px, ${
      position.y - size / 2
    }px, 0)`;
    element.style.borderColor = eraser
      ? backgrounds[backgroundRef.current].dark
        ? "rgba(255,255,255,0.85)"
        : "rgba(17,24,39,0.75)"
      : options.color;
    element.style.backgroundColor = eraser
      ? "rgba(255,255,255,0.1)"
      : "transparent";
    element.style.opacity = "1";
  }, [brushRef, stageRef, activeToolRef, optionsRef, backgroundRef]);

  const schedule = useCallback(() => {
    if (frame.current === null) frame.current = requestAnimationFrame(paint);
  }, [paint]);

  useEffect(() => {
    if (!ready) return undefined;

    const onMove = (event: PointerEvent) => {
      const overCanvas = (event.target as HTMLElement)?.closest?.(
        "[data-paintpad-canvas]"
      );
      point.current = overCanvas
        ? { x: event.clientX, y: event.clientY }
        : null;
      schedule();
    };
    const onLeave = () => {
      point.current = null;
      schedule();
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
      if (frame.current !== null) cancelAnimationFrame(frame.current);
      frame.current = null;
    };
  }, [containerRef, ready, schedule]);

  return { refreshBrush: schedule };
};
