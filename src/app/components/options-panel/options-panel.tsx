import React from "react";
import { useRecoilState, useRecoilValue } from "recoil";
import { IDrawingOptions } from "@/app/interfaces";
import { tools } from "@/app/tools";
import { activeToolState, drawingOptionsState, PALETTE } from "@/app/stores";
import ColorPicker from "../color-picker/color-picker";
import { Icon } from "../icons";

const MAX_RECENTS = 10;

interface ISliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  onChange: (value: number) => void;
}

const Slider = ({
  label,
  value,
  min,
  max,
  step = 1,
  suffix = "",
  onChange
}: ISliderProps) => (
  <label className="flex min-w-[132px] flex-1 flex-col gap-1">
    <span className="flex items-center justify-between">
      <span className="pp-label">{label}</span>
      <span className="font-mono text-[11px] text-white/70">
        {value}
        {suffix}
      </span>
    </span>
    <input
      type="range"
      className="pp-range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(event) => onChange(Number(event.target.value))}
    />
  </label>
);

const OptionsPanel = () => {
  const activeTool = useRecoilValue(activeToolState);
  const [options, setOptions] = useRecoilState(drawingOptionsState);
  const tool = tools[activeTool];
  const size = options.sizeByTool[activeTool] ?? tool.defaultSize;

  const patch = (next: Partial<IDrawingOptions>) =>
    setOptions((prev) => ({ ...prev, ...next }));

  const setColor = (hex: string) =>
    setOptions((prev) => ({
      ...prev,
      color: hex,
      recentColors: [
        hex,
        ...prev.recentColors.filter(
          (value) =>
            value.toLowerCase() !== hex.toLowerCase() &&
            !PALETTE.includes(value.toLowerCase())
        )
      ].slice(0, MAX_RECENTS)
    }));

  const setSize = (value: number) =>
    setOptions((prev) => ({
      ...prev,
      sizeByTool: { ...prev.sizeByTool, [activeTool]: value }
    }));

  const showsAnything =
    tool.supports.color ||
    tool.supports.size ||
    tool.supports.opacity ||
    tool.supports.fill ||
    tool.supports.fontSize;

  return (
    <div className="pointer-events-none fixed inset-x-3 bottom-[74px] z-30 md:inset-x-auto md:bottom-auto md:left-[84px] md:top-1/2 md:w-[238px] md:-translate-y-1/2">
      <div className="pp-panel pointer-events-auto flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2 md:flex-col md:items-stretch md:gap-3 md:p-3">
        <span className="flex items-center gap-2 pr-1">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-white/80">
            <Icon name={tool.id} size={16} />
          </span>
          <span className="text-[13px] font-semibold text-white/90">
            {tool.label}
          </span>
        </span>

        {showsAnything ? (
          <>
            <span className="pp-divider-v md:hidden" />
            <span className="hidden h-px w-full bg-white/10 md:block" />
          </>
        ) : null}

        {tool.supports.color ? (
          <ColorPicker
            value={options.color}
            recents={options.recentColors}
            label="Stroke colour"
            onChange={setColor}
          />
        ) : null}

        {tool.supports.fill ? (
          <span className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => patch({ filled: !options.filled })}
              className={`pp-chip ${
                options.filled ? "bg-white/15 text-white" : ""
              }`}
            >
              <span
                className="h-4 w-4 rounded border border-white/30"
                style={{
                  backgroundColor: options.filled
                    ? options.fillColor
                    : "transparent"
                }}
              />
              Fill
            </button>
            {options.filled ? (
              <ColorPicker
                value={options.fillColor}
                recents={options.recentColors}
                label="Fill colour"
                onChange={(hex) => patch({ fillColor: hex })}
              />
            ) : null}
          </span>
        ) : null}

        {tool.supports.size ? (
          <Slider
            label="Size"
            value={size}
            min={1}
            max={activeTool === "eraser" ? 120 : 60}
            onChange={setSize}
          />
        ) : null}

        {tool.supports.fontSize ? (
          <Slider
            label="Font"
            value={options.fontSize}
            min={10}
            max={140}
            onChange={(value) => patch({ fontSize: value })}
          />
        ) : null}

        {tool.supports.opacity ? (
          <Slider
            label="Opacity"
            value={Math.round(options.opacity * 100)}
            min={5}
            max={100}
            suffix="%"
            onChange={(value) => patch({ opacity: value / 100 })}
          />
        ) : null}

        <span className="hidden text-[11.5px] leading-relaxed text-white/45 md:block">
          {tool.hint}
        </span>
      </div>
    </div>
  );
};

export default OptionsPanel;
