import { useEffect, useRef } from "react";
import { IExportOptions, ToolId } from "../interfaces";
import { toolByShortcut } from "../tools";

export interface IShortcutActions {
  undo: () => void;
  redo: () => void;
  exportImage: (options: IExportOptions) => void;
  copyImage: () => void;
  zoomBy: (factor: number) => void;
  resetZoom: () => void;
  fitDrawing: () => void;
  nudgeSize: (delta: number) => void;
  selectTool: (id: ToolId) => void;
  toggleShortcuts: () => void;
  closeShortcuts: () => void;
}

const isTypingTarget = (target: EventTarget | null) => {
  const element = target as HTMLElement | null;
  return !!element && ["INPUT", "TEXTAREA"].includes(element.tagName);
};

export const useShortcuts = (actions: IShortcutActions) => {
  // Kept in a ref so the listener is bound once instead of on every render.
  const ref = useRef(actions);
  ref.current = actions;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) return;

      const actions = ref.current;
      const mod = event.metaKey || event.ctrlKey;
      const key = event.key;

      if (mod) {
        switch (key.toLowerCase()) {
          case "z":
            event.preventDefault();
            if (event.shiftKey) actions.redo();
            else actions.undo();
            return;
          case "y":
            event.preventDefault();
            actions.redo();
            return;
          case "s":
            event.preventDefault();
            actions.exportImage({
              format: "png",
              scale: 2,
              transparent: false
            });
            return;
          case "c":
            event.preventDefault();
            actions.copyImage();
            return;
          default:
            return;
        }
      }

      if (key === "?" || (event.shiftKey && key === "/")) {
        event.preventDefault();
        actions.toggleShortcuts();
        return;
      }
      if (key === "Escape") {
        actions.closeShortcuts();
        return;
      }
      if (key === "+" || key === "=") return actions.zoomBy(1.2);
      if (key === "-" || key === "_") return actions.zoomBy(1 / 1.2);
      if (key === "0" || key === ")") return actions.resetZoom();
      if (key === "1" || key === "!") return actions.fitDrawing();
      if (key === "]") return actions.nudgeSize(1);
      if (key === "[") return actions.nudgeSize(-1);

      const tool = toolByShortcut(key);
      if (tool) {
        event.preventDefault();
        actions.selectTool(tool.id);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
};
