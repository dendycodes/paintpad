import React from "react";
import { useRecoilValue } from "recoil";
import { backgrounds } from "@/app/services";
import { backgroundState, canvasEmptyState } from "@/app/stores";
import { Icon } from "../icons";

const hints: [string, string][] = [
  ["Draw", "P"],
  ["Shapes", "R"],
  ["Text", "T"],
  ["Pan", "Space"],
  ["Shortcuts", "?"]
];

/** First-run affordance. Disappears the moment anything lands on the canvas. */
const EmptyHint = () => {
  const empty = useRecoilValue(canvasEmptyState);
  const dark = backgrounds[useRecoilValue(backgroundState)].dark;
  if (!empty) return null;

  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <div
        className={`flex flex-col items-center gap-3 ${
          dark ? "text-white/25" : "text-slate-900/20"
        }`}
      >
        <Icon name="pencil" size={30} strokeWidth={1.4} />
        <p className="text-[15px] font-medium">Start drawing anywhere</p>
        <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-[12px]">
          {hints.map(([label, key]) => (
            <li key={label} className="flex items-center gap-1.5">
              {label}
              <span
                className={`rounded border px-1 py-px text-[10px] font-semibold uppercase ${
                  dark ? "border-white/20" : "border-slate-900/20"
                }`}
              >
                {key}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default EmptyHint;
