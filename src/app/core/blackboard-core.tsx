"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Node } from "konva/lib/Node";
import { useRecoilState, useSetRecoilState } from "recoil";

import {
  EmptyHint,
  OptionsPanel,
  Shortcuts,
  Toast,
  Toolbar,
  TopBar,
  ZoomBar
} from "../components";
import { BackgroundKind, IExportOptions, ToolId } from "../interfaces";
import { CANCEL_EVENT, DESELECT_EVENT, attachTool, tools } from "../tools";
import { IHistoryApi, IToolContext } from "../tools/tools-services/context";
import {
  HistoryManager,
  applyHistoryEntry,
  backgrounds,
  captureState,
  copyStageToClipboard,
  exportStage,
  flushSave,
  placeImage,
  readFileAsDataURL,
  saveBackground,
  saveDrawing,
  serializeNode,
  snapshotOf
} from "../services";
import {
  activeToolState,
  backgroundState,
  canvasEmptyState,
  drawingOptionsState,
  historyState,
  shortcutsOpenState,
  toastState,
  zoomState
} from "../stores";
import { useStage } from "./use-stage";
import { useViewport } from "./use-viewport";
import { useBrushCursor } from "./use-brush-cursor";
import { useShortcuts } from "./use-shortcuts";

const BlackboardCore = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const paperRef = useRef<HTMLDivElement>(null);
  const brushRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef(new HistoryManager());

  const [activeTool, setActiveTool] = useRecoilState(activeToolState);
  const [options, setOptions] = useRecoilState(drawingOptionsState);
  const [background, setBackground] = useRecoilState(backgroundState);
  const setZoom = useSetRecoilState(zoomState);
  const setHistoryFlags = useSetRecoilState(historyState);
  const setToast = useSetRecoilState(toastState);
  const setShortcutsOpen = useSetRecoilState(shortcutsOpenState);
  const setCanvasEmpty = useSetRecoilState(canvasEmptyState);

  // Mirrors of React state for the imperative canvas code.
  const backgroundRef = useRef<BackgroundKind>(background);
  const activeToolRef = useRef<ToolId>(activeTool);
  const optionsRef = useRef(options);
  const previousToolRef = useRef<ToolId>("pencil");

  const { containerRef, stageRef, drawingRef, liveRef, overlayRef, ready } =
    useStage({
      onPaperRestored: (kind) => {
        backgroundRef.current = kind;
        setBackground(kind);
      }
    });

  const { isPanning, sync, zoomBy, resetZoom, fitDrawing } = useViewport({
    containerRef,
    stageRef,
    drawingRef,
    paperRef,
    backgroundRef,
    activeToolRef,
    ready,
    onZoomChange: setZoom
  });

  const { refreshBrush } = useBrushCursor({
    containerRef,
    brushRef,
    stageRef,
    activeToolRef,
    optionsRef,
    backgroundRef,
    ready
  });

  /* ------------------------------------------------------------ mirrors */
  useEffect(() => {
    optionsRef.current = options;
    refreshBrush();
  }, [options, refreshBrush]);

  useEffect(() => {
    backgroundRef.current = background;
    if (ready) {
      saveBackground(background);
      sync();
      refreshBrush();
    }
  }, [background, ready, sync, refreshBrush]);

  useEffect(() => {
    if (activeToolRef.current !== activeTool) {
      if (activeToolRef.current !== "eyedropper") {
        previousToolRef.current = activeToolRef.current;
      }
      activeToolRef.current = activeTool;
    }
    if (containerRef.current && !isPanning()) {
      containerRef.current.style.cursor = tools[activeTool].cursor;
    }
    refreshBrush();
  }, [activeTool, containerRef, isPanning, refreshBrush]);

  /* ------------------------------------------------------------ history */
  const requestSave = useCallback(() => {
    const drawing = drawingRef.current;
    if (!drawing) return;
    setCanvasEmpty(drawing.getChildren().length === 0);
    saveDrawing(() => snapshotOf(drawing), backgroundRef.current);
  }, [drawingRef, setCanvasEmpty]);

  const history: IHistoryApi = useMemo(
    () => ({
      capture: captureState,
      add: (nodes: Node[]) => {
        if (!nodes.length) return;
        historyRef.current.push({ kind: "add", nodes: nodes.map(serializeNode) });
        requestSave();
      },
      remove: (nodes: Node[]) => {
        if (!nodes.length) return;
        const serialized = nodes.map(serializeNode);
        nodes.forEach((node) => node.destroy());
        drawingRef.current?.batchDraw();
        historyRef.current.push({ kind: "remove", nodes: serialized });
        requestSave();
      },
      modify: (records) => {
        const changes = records
          .map(({ node, before }) => ({
            id: node.id(),
            before,
            after: captureState(node)
          }))
          .filter(
            (change) =>
              JSON.stringify(change.before) !== JSON.stringify(change.after)
          );
        if (!changes.length) return;
        historyRef.current.push({ kind: "modify", changes });
        requestSave();
      }
    }),
    [drawingRef, requestSave]
  );

  useEffect(() => {
    if (!ready) return undefined;
    const manager = historyRef.current;
    const update = () =>
      setHistoryFlags({ canUndo: manager.canUndo, canRedo: manager.canRedo });
    update();
    setCanvasEmpty((drawingRef.current?.getChildren().length ?? 0) === 0);
    return manager.subscribe(update);
  }, [ready, drawingRef, setHistoryFlags, setCanvasEmpty]);

  const travel = useCallback(
    (invert: boolean) => {
      const drawing = drawingRef.current;
      const stage = stageRef.current;
      if (!drawing || !stage) return;
      const entry = invert
        ? historyRef.current.undo()
        : historyRef.current.redo();
      if (!entry) return;
      applyHistoryEntry(drawing, entry, invert);
      // Restored nodes are brand new objects, so any selection is stale.
      stage.fire(DESELECT_EVENT);
      requestSave();
    },
    [drawingRef, stageRef, requestSave]
  );

  const undo = useCallback(() => travel(true), [travel]);
  const redo = useCallback(() => travel(false), [travel]);

  /* --------------------------------------------------------------- tool */
  useEffect(() => {
    const stage = stageRef.current;
    const drawing = drawingRef.current;
    const live = liveRef.current;
    const overlay = overlayRef.current;
    if (!ready || !stage || !drawing || !live || !overlay) return undefined;

    const ctx: IToolContext = {
      stage,
      drawing,
      live,
      overlay,
      getOptions: () => optionsRef.current,
      getSize: () =>
        optionsRef.current.sizeByTool[activeToolRef.current] ??
        tools[activeToolRef.current].defaultSize,
      getPaperColor: () => backgrounds[backgroundRef.current].paper,
      getPreviousTool: () => previousToolRef.current,
      history,
      setColor: (hex) => setOptions((prev) => ({ ...prev, color: hex })),
      selectTool: (id) => setActiveTool(id),
      notify: (message) => setToast(message),
      isPanning
    };

    stage.draggable(activeTool === "pan");
    return attachTool(activeTool, ctx);
  }, [
    ready,
    activeTool,
    stageRef,
    drawingRef,
    liveRef,
    overlayRef,
    history,
    isPanning,
    setOptions,
    setActiveTool,
    setToast
  ]);

  /* ------------------------------------------------------------ actions */
  const clearAll = useCallback(() => {
    const drawing = drawingRef.current;
    if (!drawing?.getChildren().length) return;
    stageRef.current?.fire(DESELECT_EVENT);
    history.remove([...drawing.getChildren()]);
    setToast("Canvas cleared — Ctrl+Z brings it back");
  }, [drawingRef, stageRef, history, setToast]);

  const exportImage = useCallback(
    (exportOptions: IExportOptions) => {
      const stage = stageRef.current;
      const drawing = drawingRef.current;
      if (!stage || !drawing) return;
      exportStage(
        stage,
        drawing,
        backgrounds[backgroundRef.current].paper,
        exportOptions
      );
      setToast(`Exported ${exportOptions.format.toUpperCase()}`);
    },
    [stageRef, drawingRef, setToast]
  );

  const copyImage = useCallback(async () => {
    const stage = stageRef.current;
    const drawing = drawingRef.current;
    if (!stage || !drawing) return;
    const ok = await copyStageToClipboard(
      stage,
      drawing,
      backgrounds[backgroundRef.current].paper
    );
    setToast(ok ? "Copied to clipboard" : "Clipboard not available here");
  }, [stageRef, drawingRef, setToast]);

  const insertImage = useCallback(
    async (dataUrl: string, at?: { x: number; y: number } | null) => {
      const stage = stageRef.current;
      const drawing = drawingRef.current;
      if (!stage || !drawing) return;
      try {
        const node = await placeImage({ stage, drawing, dataUrl, at });
        history.add([node]);
        setToast("Image added — press V to move it");
      } catch {
        setToast("That image could not be loaded");
      }
    },
    [stageRef, drawingRef, history, setToast]
  );

  const nudgeSize = useCallback(
    (delta: number) => {
      const tool = tools[activeToolRef.current];
      if (!tool.supports.size) return;
      setOptions((prev) => {
        const current = prev.sizeByTool[tool.id] ?? tool.defaultSize;
        return {
          ...prev,
          sizeByTool: {
            ...prev.sizeByTool,
            [tool.id]: Math.min(120, Math.max(1, current + delta))
          }
        };
      });
    },
    [setOptions]
  );

  /* ------------------------------------------------- drop / paste / menu */
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !ready) return undefined;

    const onDragOver = (event: DragEvent) => event.preventDefault();
    const onDrop = async (event: DragEvent) => {
      event.preventDefault();
      const file = Array.from(event.dataTransfer?.files ?? []).find((item) =>
        item.type.startsWith("image/")
      );
      if (!file) return;
      const rect = container.getBoundingClientRect();
      insertImage(await readFileAsDataURL(file), {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      });
    };

    const onPaste = async (event: ClipboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA"].includes(target.tagName)) return;
      const file = Array.from(event.clipboardData?.items ?? [])
        .filter((item) => item.type.startsWith("image/"))
        .map((item) => item.getAsFile())
        .find(Boolean);
      if (!file) return;
      event.preventDefault();
      insertImage(await readFileAsDataURL(file));
    };

    const onContextMenu = (event: MouseEvent) => event.preventDefault();

    container.addEventListener("dragover", onDragOver);
    container.addEventListener("drop", onDrop);
    container.addEventListener("contextmenu", onContextMenu);
    document.addEventListener("paste", onPaste);
    return () => {
      container.removeEventListener("dragover", onDragOver);
      container.removeEventListener("drop", onDrop);
      container.removeEventListener("contextmenu", onContextMenu);
      document.removeEventListener("paste", onPaste);
    };
  }, [containerRef, ready, insertImage]);

  /* --------------------------------- cancel strokes / flush save on leave */
  useEffect(() => {
    if (!ready) return undefined;
    const cancel = () => stageRef.current?.fire(CANCEL_EVENT);
    const onHidden = () => {
      cancel();
      if (document.visibilityState === "hidden") flushSave();
    };
    window.addEventListener("blur", cancel);
    window.addEventListener("pagehide", flushSave);
    document.addEventListener("visibilitychange", onHidden);
    return () => {
      window.removeEventListener("blur", cancel);
      window.removeEventListener("pagehide", flushSave);
      document.removeEventListener("visibilitychange", onHidden);
    };
  }, [ready, stageRef]);

  useShortcuts({
    undo,
    redo,
    exportImage,
    copyImage,
    zoomBy,
    resetZoom,
    fitDrawing,
    nudgeSize,
    selectTool: setActiveTool,
    toggleShortcuts: () => setShortcutsOpen((open) => !open),
    closeShortcuts: () => setShortcutsOpen(false)
  });

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <div ref={paperRef} className="pointer-events-none absolute inset-0" />
      <div
        ref={containerRef}
        data-paintpad-canvas="true"
        className="pp-canvas absolute inset-0 select-none"
      />
      <div ref={brushRef} className="pp-brush" />

      <EmptyHint />

      <TopBar
        onUndo={undo}
        onRedo={redo}
        onClear={clearAll}
        onCopy={copyImage}
        onImport={() => fileInputRef.current?.click()}
        onExport={exportImage}
      />
      <OptionsPanel />
      <Toolbar />
      <ZoomBar
        onZoomIn={() => zoomBy(1.2)}
        onZoomOut={() => zoomBy(1 / 1.2)}
        onReset={resetZoom}
        onFit={fitDrawing}
      />
      <Toast />
      <Shortcuts />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) insertImage(await readFileAsDataURL(file));
        }}
      />
    </div>
  );
};

export default BlackboardCore;
