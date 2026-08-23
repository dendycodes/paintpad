import React, { useState } from "react";
import classNames from "classnames";
import { useRecoilState, useRecoilValue } from "recoil";
import { IExportOptions } from "@/app/interfaces";
import { backgroundList, backgroundStyle } from "@/app/services";
import {
  backgroundState,
  historyState,
  shortcutsOpenState
} from "@/app/stores";
import { Icon } from "../icons";
import { IconButton, usePopover } from "../ui";

interface ITopBarProps {
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onCopy: () => void;
  onImport: () => void;
  onExport: (options: IExportOptions) => void;
}

const TopBar = ({
  onUndo,
  onRedo,
  onClear,
  onCopy,
  onImport,
  onExport
}: ITopBarProps) => {
  const history = useRecoilValue(historyState);
  const [background, setBackground] = useRecoilState(backgroundState);
  const [, setShortcutsOpen] = useRecoilState(shortcutsOpenState);

  const paper = usePopover<HTMLDivElement>();
  const exporter = usePopover<HTMLDivElement>();
  const [exportOptions, setExportOptions] = useState<IExportOptions>({
    format: "png",
    scale: 2,
    transparent: false
  });

  return (
    <>
      <div className="pointer-events-none fixed left-4 top-3 z-30 hidden md:block">
        <div className="pp-panel pointer-events-auto flex items-center gap-2 px-3 py-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white">
            <Icon name="palette" size={16} />
          </span>
          <span className="text-[13px] font-semibold tracking-tight text-white/90">
            PaintPad
          </span>
        </div>
      </div>

      <div className="pointer-events-none fixed right-3 top-3 z-30">
        <div className="pp-panel pointer-events-auto flex max-w-[calc(100vw-24px)] flex-wrap items-center justify-end gap-1 p-1.5">
          <IconButton
            icon="undo"
            label="Undo"
            shortcut="⌘Z"
            tip="bottom"
            disabled={!history.canUndo}
            onClick={onUndo}
          />
          <IconButton
            icon="redo"
            label="Redo"
            shortcut="⇧⌘Z"
            tip="bottom"
            disabled={!history.canRedo}
            onClick={onRedo}
          />

          <span className="pp-divider-v" />

          <div className="relative" ref={paper.ref}>
            <IconButton
              icon="grid"
              label="Paper"
              tip="bottom"
              active={paper.open}
              onClick={paper.toggle}
            />
            {paper.open ? (
              <div className="pp-panel pp-pop absolute right-0 top-[calc(100%+10px)] w-[212px] p-3">
                <p className="pp-label mb-2">Paper</p>
                <div className="grid grid-cols-2 gap-2">
                  {backgroundList.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setBackground(preset.id)}
                      className={classNames(
                        "flex flex-col gap-1.5 rounded-xl border p-1.5 text-left transition-colors",
                        background === preset.id
                          ? "border-indigo-400/80 bg-white/10"
                          : "border-white/10 hover:bg-white/5"
                      )}
                    >
                      <span
                        className="h-9 w-full rounded-lg border border-white/10"
                        style={backgroundStyle(preset.id, 1, 0, 0)}
                      />
                      <span className="text-[11px] text-white/70">
                        {preset.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <IconButton
            icon="image"
            label="Add image"
            tip="bottom"
            onClick={onImport}
          />
          <IconButton
            icon="copy"
            label="Copy to clipboard"
            tip="bottom"
            className="hidden md:flex"
            onClick={onCopy}
          />

          <div className="relative" ref={exporter.ref}>
            <IconButton
              icon="download"
              label="Export"
              shortcut="⌘S"
              tip="bottom"
              active={exporter.open}
              onClick={exporter.toggle}
            />
            {exporter.open ? (
              <div className="pp-panel pp-pop absolute right-0 top-[calc(100%+10px)] w-[240px] p-3">
                <p className="pp-label mb-2">Format</p>
                <div className="mb-3 flex gap-1.5">
                  {(["png", "jpeg"] as const).map((format) => (
                    <button
                      key={format}
                      type="button"
                      onClick={() =>
                        setExportOptions((prev) => ({ ...prev, format }))
                      }
                      className={classNames(
                        "flex-1 rounded-lg border py-1.5 text-[12px] font-medium uppercase transition-colors",
                        exportOptions.format === format
                          ? "border-indigo-400/80 bg-white/10 text-white"
                          : "border-white/10 text-white/60 hover:bg-white/5"
                      )}
                    >
                      {format === "jpeg" ? "jpg" : format}
                    </button>
                  ))}
                </div>

                <p className="pp-label mb-2">Scale</p>
                <div className="mb-3 flex gap-1.5">
                  {[1, 2, 3].map((scale) => (
                    <button
                      key={scale}
                      type="button"
                      onClick={() =>
                        setExportOptions((prev) => ({ ...prev, scale }))
                      }
                      className={classNames(
                        "flex-1 rounded-lg border py-1.5 text-[12px] font-medium transition-colors",
                        exportOptions.scale === scale
                          ? "border-indigo-400/80 bg-white/10 text-white"
                          : "border-white/10 text-white/60 hover:bg-white/5"
                      )}
                    >
                      {scale}x
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  disabled={exportOptions.format !== "png"}
                  onClick={() =>
                    setExportOptions((prev) => ({
                      ...prev,
                      transparent: !prev.transparent
                    }))
                  }
                  className={classNames(
                    "mb-3 flex w-full items-center justify-between rounded-lg border border-white/10 px-2.5 py-1.5 text-[12px] transition-colors",
                    exportOptions.format !== "png"
                      ? "cursor-not-allowed text-white/25"
                      : "text-white/75 hover:bg-white/5"
                  )}
                >
                  Transparent background
                  <span
                    className={classNames(
                      "flex h-4 w-4 items-center justify-center rounded border",
                      exportOptions.transparent && exportOptions.format === "png"
                        ? "border-indigo-400 bg-indigo-500 text-white"
                        : "border-white/25"
                    )}
                  >
                    {exportOptions.transparent &&
                    exportOptions.format === "png" ? (
                      <Icon name="check" size={11} strokeWidth={3} />
                    ) : null}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onExport(exportOptions);
                    exporter.setOpen(false);
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-500 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-indigo-400"
                >
                  <Icon name="download" size={15} />
                  Download
                </button>
              </div>
            ) : null}
          </div>

          <span className="pp-divider-v" />

          <IconButton
            icon="trash"
            label="Clear canvas"
            tip="bottom"
            onClick={onClear}
          />
          <IconButton
            icon="keyboard"
            label="Shortcuts"
            shortcut="?"
            tip="bottom"
            className="hidden md:flex"
            onClick={() => setShortcutsOpen(true)}
          />
        </div>
      </div>
    </>
  );
};

export default TopBar;
