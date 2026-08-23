import React, { useEffect, useRef, useState } from "react";
import classNames from "classnames";
import { PALETTE } from "@/app/stores";
import { Icon } from "../icons";

interface IColorPickerProps {
  value: string;
  recents: string[];
  label: string;
  onChange: (hex: string) => void;
}

const isHex = (value: string) => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value);

const ColorPicker = ({ value, recents, label, onChange }: IColorPickerProps) => {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => setDraft(value), [value]);

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event: MouseEvent) => {
      if (!root.current?.contains(event.target as globalThis.Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const commitHex = (next: string) => {
    const hex = next.startsWith("#") ? next : `#${next}`;
    setDraft(hex);
    if (isHex(hex)) onChange(hex);
  };

  return (
    <div className="relative" ref={root}>
      <button
        type="button"
        aria-label={label}
        onClick={() => setOpen((prev) => !prev)}
        className="pp-has-tip relative flex h-9 items-center gap-2 rounded-xl px-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
      >
        <span
          className="h-6 w-6 rounded-lg border border-white/25 shadow-inner"
          style={{ backgroundColor: value }}
        />
        <Icon name="chevron" size={14} />
        <span className="pp-tip bottom-[calc(100%+10px)] left-1/2 -translate-x-1/2">
          {label}
        </span>
      </button>

      {open ? (
        <div className="pp-panel pp-pop absolute bottom-[calc(100%+10px)] left-0 z-50 w-[236px] p-3 md:bottom-auto md:left-[calc(100%+14px)] md:top-0">
          <p className="pp-label mb-2">Palette</p>
          <div className="grid grid-cols-6 gap-1.5">
            {PALETTE.map((hex) => (
              <button
                key={hex}
                type="button"
                aria-label={hex}
                onClick={() => onChange(hex)}
                className={classNames(
                  "flex h-7 w-7 items-center justify-center rounded-lg border transition-transform hover:scale-110",
                  value.toLowerCase() === hex.toLowerCase()
                    ? "border-white"
                    : "border-white/15"
                )}
                style={{ backgroundColor: hex }}
              >
                {value.toLowerCase() === hex.toLowerCase() ? (
                  <Icon
                    name="check"
                    size={14}
                    strokeWidth={3}
                    className={
                      hex === "#ffffff" ? "text-black/70" : "text-white"
                    }
                  />
                ) : null}
              </button>
            ))}
          </div>

          {recents.length ? (
            <>
              <p className="pp-label mb-2 mt-3">Recent</p>
              <div className="flex flex-wrap gap-1.5">
                {recents.map((hex) => (
                  <button
                    key={`recent-${hex}`}
                    type="button"
                    aria-label={hex}
                    onClick={() => onChange(hex)}
                    className="h-6 w-6 rounded-lg border border-white/15 transition-transform hover:scale-110"
                    style={{ backgroundColor: hex }}
                  />
                ))}
              </div>
            </>
          ) : null}

          <p className="pp-label mb-2 mt-3">Custom</p>
          <div className="flex items-center gap-2">
            <span className="h-8 w-8 overflow-hidden rounded-lg border border-white/15">
              <input
                type="color"
                className="pp-color"
                value={isHex(draft) ? draft : value}
                onChange={(event) => commitHex(event.target.value)}
              />
            </span>
            <input
              type="text"
              spellCheck={false}
              value={draft}
              onChange={(event) => commitHex(event.target.value)}
              className="h-8 w-full rounded-lg border border-white/10 bg-black/30 px-2 font-mono text-[13px] uppercase text-white/85 outline-none focus:border-indigo-400/60"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default ColorPicker;
