import React from "react";
import { useRecoilValue } from "recoil";
import { zoomState } from "@/app/stores";
import { IconButton } from "../ui";

interface IZoomBarProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  onFit: () => void;
}

const ZoomBar = ({ onZoomIn, onZoomOut, onReset, onFit }: IZoomBarProps) => {
  const zoom = useRecoilValue(zoomState);

  return (
    <div className="pointer-events-none fixed bottom-3 right-3 z-30 hidden md:block">
      <div className="pp-panel pointer-events-auto flex items-center gap-1 p-1.5">
        <IconButton
          icon="zoomOut"
          label="Zoom out"
          shortcut="−"
          tip="top"
          onClick={onZoomOut}
        />
        <button
          type="button"
          onClick={onReset}
          className="pp-has-tip relative h-9 min-w-[62px] rounded-xl font-mono text-[12px] text-white/75 transition-colors hover:bg-white/10 hover:text-white"
        >
          {zoom}%
          <span className="pp-tip bottom-[calc(100%+10px)] left-1/2 -translate-x-1/2">
            Reset zoom
          </span>
        </button>
        <IconButton
          icon="zoomIn"
          label="Zoom in"
          shortcut="+"
          tip="top"
          onClick={onZoomIn}
        />
        <span className="pp-divider-v" />
        <IconButton
          icon="fit"
          label="Fit drawing"
          shortcut="1"
          tip="top"
          onClick={onFit}
        />
      </div>
    </div>
  );
};

export default ZoomBar;
