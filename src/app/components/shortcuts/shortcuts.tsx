import React from "react";
import { useRecoilState } from "recoil";
import { toolList } from "@/app/tools";
import { shortcutsOpenState } from "@/app/stores";
import { Icon } from "../icons";

const actionShortcuts: [string, string][] = [
  ["Undo", "Ctrl / ⌘ + Z"],
  ["Redo", "Ctrl / ⌘ + Shift + Z"],
  ["Export image", "Ctrl / ⌘ + S"],
  ["Copy to clipboard", "Ctrl / ⌘ + C"],
  ["Paste image", "Ctrl / ⌘ + V"],
  ["Select all", "Ctrl / ⌘ + A"],
  ["Rubber-band select", "Drag on empty canvas"],
  ["Duplicate selection", "Ctrl / ⌘ + D"],
  ["Delete selection", "Delete"],
  ["Nudge selection", "Arrows · Shift for 10px"],
  ["Pan the canvas", "Space + drag · middle drag"],
  ["Zoom", "Ctrl / ⌘ + wheel · pinch · + / −"],
  ["Scroll canvas", "Wheel · Shift + wheel"],
  ["Reset zoom", "0"],
  ["Fit drawing", "1"],
  ["Constrain shape", "Shift while drawing"],
  ["Draw from centre", "Alt while drawing"],
  ["Bigger / smaller brush", "] / ["],
  ["This dialog", "?"]
];

const Shortcuts = () => {
  const [open, setOpen] = useRecoilState(shortcutsOpenState);
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <div
        className="pp-panel pp-pop pp-scroll max-h-[82vh] w-[min(720px,100%)] overflow-y-auto p-5"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-white">
            Keyboard shortcuts
          </h2>
          <button
            type="button"
            aria-label="Close"
            onClick={() => setOpen(false)}
            className="pp-btn"
          >
            <Icon name="close" />
          </button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <section>
            <p className="pp-label mb-2">Tools</p>
            <ul className="flex flex-col gap-1.5">
              {toolList.map((tool) => (
                <li
                  key={tool.id}
                  className="flex items-center justify-between gap-3 text-[13px] text-white/75"
                >
                  <span className="flex items-center gap-2">
                    <Icon name={tool.id} size={15} className="text-white/45" />
                    {tool.label}
                  </span>
                  <kbd className="pp-kbd">{tool.shortcut}</kbd>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <p className="pp-label mb-2">Actions</p>
            <ul className="flex flex-col gap-1.5">
              {actionShortcuts.map(([label, keys]) => (
                <li
                  key={label}
                  className="flex items-center justify-between gap-3 text-[13px] text-white/75"
                >
                  <span>{label}</span>
                  <span className="text-right font-mono text-[11px] text-white/50">
                    {keys}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <p className="mt-5 border-t border-white/10 pt-3 text-[12px] text-white/40">
          Your drawing is saved to this browser automatically — close the tab and
          it will still be here.
        </p>
      </div>
    </div>
  );
};

export default Shortcuts;
