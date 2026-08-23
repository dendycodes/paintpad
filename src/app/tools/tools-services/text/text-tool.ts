import { Text } from "konva/lib/shapes/Text";
import { KonvaEventObject } from "konva/lib/Node";
import { nextNodeId } from "@/app/services";
import { IToolContext, NS, ToolCleanup, isDrawingEvent, relativePointer } from "../context";

export const TEXT_FONT = 'Inter, "Segoe UI", system-ui, -apple-system, sans-serif';

/**
 * Click to drop a caret anywhere on the canvas. A transparent textarea is
 * overlaid on the stage so the browser handles caret, selection and IME, and
 * the value is baked into a Konva text node when the editor closes.
 */
export const attachTextTool = (ctx: IToolContext): ToolCleanup => {
  const { stage } = ctx;
  let editor: HTMLTextAreaElement | null = null;
  let anchor = { x: 0, y: 0 };

  const closeEditor = (keep: boolean) => {
    const element = editor;
    if (!element) return;
    // Detach first: removing a focused textarea fires blur, which would
    // otherwise re-enter this function.
    editor = null;
    const value = element.value.replace(/\s+$/, "");
    element.remove();

    if (!keep || !value) return;

    const options = ctx.getOptions();
    const node = new Text({
      id: nextNodeId(),
      x: anchor.x,
      y: anchor.y,
      text: value,
      fontSize: options.fontSize,
      fontFamily: TEXT_FONT,
      fill: options.color,
      opacity: options.opacity,
      lineHeight: 1.25,
      listening: false,
      perfectDrawEnabled: false
    });
    ctx.drawing.add(node);
    ctx.drawing.batchDraw();
    ctx.history.add([node]);
  };

  const openEditor = (pointer: { x: number; y: number }) => {
    anchor = relativePointer(stage);

    const rect = stage.container().getBoundingClientRect();
    const zoom = stage.scaleX() || 1;
    const options = ctx.getOptions();
    const fontSize = options.fontSize * zoom;

    editor = document.createElement("textarea");
    editor.setAttribute("data-paintpad-editor", "true");
    editor.value = "";
    editor.placeholder = "Type…";
    Object.assign(editor.style, {
      position: "fixed",
      left: `${rect.left + pointer.x}px`,
      top: `${rect.top + pointer.y}px`,
      margin: "0",
      padding: "0",
      border: "none",
      outline: "none",
      background: "transparent",
      overflow: "hidden",
      resize: "none",
      whiteSpace: "pre",
      lineHeight: "1.25",
      minWidth: "12ch",
      minHeight: `${fontSize * 1.25}px`,
      height: `${fontSize * 1.25}px`,
      color: options.color,
      opacity: `${options.opacity}`,
      caretColor: options.color,
      fontSize: `${fontSize}px`,
      fontFamily: TEXT_FONT,
      zIndex: "40"
    } as Partial<CSSStyleDeclaration>);

    const autoGrow = () => {
      if (!editor) return;
      editor.style.height = "auto";
      editor.style.height = `${editor.scrollHeight}px`;
      editor.style.width = "auto";
      editor.style.width = `${editor.scrollWidth + fontSize}px`;
    };

    editor.addEventListener("input", autoGrow);
    editor.addEventListener("keydown", (event) => {
      event.stopPropagation();
      if (event.key === "Escape") {
        event.preventDefault();
        closeEditor(true);
      }
      if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        closeEditor(true);
      }
    });
    editor.addEventListener("blur", () => closeEditor(true));

    document.body.appendChild(editor);
    editor.focus();
  };

  let pending = false;

  const onPointerDown = (event: KonvaEventObject<PointerEvent>) => {
    if (!isDrawingEvent(ctx, event.evt)) return;
    // Suppressing the default keeps the browser from moving focus off the
    // editor we are about to open on pointerup.
    event.evt.preventDefault?.();
    if (editor) {
      closeEditor(true);
      pending = false;
      return;
    }
    pending = true;
  };

  const onPointerUp = () => {
    if (!pending) return;
    pending = false;
    const pointer = stage.getPointerPosition();
    if (pointer) openEditor(pointer);
  };

  stage.on(`pointerdown${NS}`, onPointerDown);
  stage.on(`pointerup${NS}`, onPointerUp);

  return () => {
    stage.off(NS);
    closeEditor(true);
  };
};
