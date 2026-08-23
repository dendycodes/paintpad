export type ToolId =
  | "select"
  | "pan"
  | "pencil"
  | "marker"
  | "highlighter"
  | "eraser"
  | "line"
  | "arrow"
  | "rect"
  | "ellipse"
  | "text"
  | "eyedropper";

export type ToolGroup = "navigate" | "draw" | "shape" | "content";

export interface IToolCapabilities {
  size: boolean;
  color: boolean;
  opacity: boolean;
  fill: boolean;
  fontSize: boolean;
}

export interface ITool {
  id: ToolId;
  label: string;
  hint: string;
  cursor: string;
  shortcut: string;
  group: ToolGroup;
  defaultSize: number;
  supports: IToolCapabilities;
}
