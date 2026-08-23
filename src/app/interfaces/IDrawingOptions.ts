import { ToolId } from "./ITool";

export interface IDrawingOptions {
  color: string;
  fillColor: string;
  filled: boolean;
  opacity: number;
  fontSize: number;
  sizeByTool: Record<ToolId, number>;
  recentColors: string[];
}
