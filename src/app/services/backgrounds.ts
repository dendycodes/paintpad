import { BackgroundKind } from "../interfaces";

export interface IBackgroundPreset {
  id: BackgroundKind;
  label: string;
  paper: string;
  line: string;
  /** true when the paper is dark and light strokes read better on it */
  dark: boolean;
  pattern: "none" | "grid" | "dots" | "ruled";
}

export const backgrounds: Record<BackgroundKind, IBackgroundPreset> = {
  blank: {
    id: "blank",
    label: "Blank",
    paper: "#ffffff",
    line: "transparent",
    dark: false,
    pattern: "none"
  },
  grid: {
    id: "grid",
    label: "Grid",
    paper: "#ffffff",
    line: "#e2e8f0",
    dark: false,
    pattern: "grid"
  },
  dots: {
    id: "dots",
    label: "Dots",
    paper: "#fdfdfd",
    line: "#cbd5e1",
    dark: false,
    pattern: "dots"
  },
  ruled: {
    id: "ruled",
    label: "Ruled",
    paper: "#fffdf5",
    line: "#e7dfc9",
    dark: false,
    pattern: "ruled"
  },
  slate: {
    id: "slate",
    label: "Slate",
    paper: "#0f172a",
    line: "#1e293b",
    dark: true,
    pattern: "grid"
  }
};

export const backgroundList = Object.values(backgrounds);

const CELL = 28;

export interface IPaperMetrics {
  backgroundSize: string;
  backgroundPosition: string;
}

/** The half of the paper style that changes while panning and zooming. */
export const paperMetrics = (
  kind: BackgroundKind,
  zoom: number,
  offsetX: number,
  offsetY: number
): IPaperMetrics => {
  const preset = backgrounds[kind];
  const size = CELL * zoom;
  const position = `${offsetX}px ${offsetY}px`;

  switch (preset.pattern) {
    case "grid":
      return {
        backgroundSize: `${size}px ${size}px, ${size}px ${size}px`,
        backgroundPosition: position
      };
    case "dots":
    case "ruled":
      return { backgroundSize: `${size}px ${size}px`, backgroundPosition: position };
    default:
      return { backgroundSize: "auto", backgroundPosition: "0 0" };
  }
};

/** The half that only changes when the paper itself is switched. */
export const paperSurface = (kind: BackgroundKind, zoom = 1) => {
  const preset = backgrounds[kind];
  const thin = Math.max(1, zoom);

  switch (preset.pattern) {
    case "grid":
      return {
        backgroundColor: preset.paper,
        backgroundImage: `linear-gradient(to right, ${preset.line} ${thin}px, transparent ${thin}px), linear-gradient(to bottom, ${preset.line} ${thin}px, transparent ${thin}px)`
      };
    case "dots": {
      const radius = Math.max(1, 1.4 * zoom);
      return {
        backgroundColor: preset.paper,
        backgroundImage: `radial-gradient(${preset.line} ${radius}px, transparent ${radius}px)`
      };
    }
    case "ruled":
      return {
        backgroundColor: preset.paper,
        backgroundImage: `linear-gradient(to bottom, ${preset.line} ${thin}px, transparent ${thin}px)`
      };
    default:
      return { backgroundColor: preset.paper, backgroundImage: "none" };
  }
};

let lastKey = "";

/**
 * Writes the paper straight to the DOM. Panning only touches
 * background-position, so a pan costs one style write and no React render.
 */
export const applyPaper = (
  element: HTMLElement,
  kind: BackgroundKind,
  zoom: number,
  offsetX: number,
  offsetY: number
) => {
  const key = `${kind}:${zoom.toFixed(3)}`;
  if (key !== lastKey) {
    lastKey = key;
    const surface = paperSurface(kind, zoom);
    element.style.backgroundColor = surface.backgroundColor;
    element.style.backgroundImage = surface.backgroundImage;
    element.style.backgroundSize = paperMetrics(kind, zoom, 0, 0).backgroundSize;
  }
  element.style.backgroundPosition = `${offsetX}px ${offsetY}px`;
};

/** Convenience for static previews (the paper picker swatches). */
export const backgroundStyle = (
  kind: BackgroundKind,
  zoom: number,
  offsetX: number,
  offsetY: number
) => ({
  ...paperSurface(kind, zoom),
  ...paperMetrics(kind, zoom, offsetX, offsetY)
});
