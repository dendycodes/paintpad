export type BackgroundKind = "blank" | "grid" | "dots" | "ruled" | "slate";

export interface IExportOptions {
  format: "png" | "jpeg";
  scale: number;
  transparent: boolean;
}
