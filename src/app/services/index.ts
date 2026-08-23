export {
  HistoryManager,
  applyHistoryEntry,
  captureState,
  serializeNode,
  nextNodeId
} from "./history";
export type { HistoryEntry, NodeState, ISerializedNode } from "./history";
export { simplifyPoints } from "./geometry";
export {
  saveDrawing,
  loadDrawing,
  loadMeta,
  saveBackground,
  clearStoredDrawing,
  flushSave
} from "./persistence";
export { exportStage, copyStageToClipboard } from "./export";
export {
  backgrounds,
  backgroundList,
  backgroundStyle,
  paperSurface,
  paperMetrics,
  applyPaper
} from "./backgrounds";
export type { IBackgroundPreset, IPaperMetrics } from "./backgrounds";
export {
  MIN_ZOOM,
  MAX_ZOOM,
  DRAWING_LAYER_ID,
  LIVE_LAYER_ID,
  OVERLAY_LAYER_ID,
  clampZoom,
  snapshotOf,
  restoreDrawing,
  zoomAt,
  resetView,
  fitToContent,
  placeImage,
  readFileAsDataURL
} from "./stage-service";
