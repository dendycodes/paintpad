import React from "react";
import classNames from "classnames";
import { Icon, IconName } from "../icons";

export type TipPlacement = "right" | "left" | "top" | "bottom";

const tipPosition: Record<TipPlacement, string> = {
  right: "left-[calc(100%+10px)] top-1/2 -translate-y-1/2",
  left: "right-[calc(100%+10px)] top-1/2 -translate-y-1/2",
  top: "bottom-[calc(100%+10px)] left-1/2 -translate-x-1/2",
  bottom: "top-[calc(100%+10px)] left-1/2 -translate-x-1/2"
};

interface IIconButtonProps {
  icon: IconName;
  label: string;
  shortcut?: string;
  active?: boolean;
  disabled?: boolean;
  tip?: TipPlacement;
  className?: string;
  onClick: () => void;
}

const IconButton = ({
  icon,
  label,
  shortcut,
  active,
  disabled,
  tip = "right",
  className,
  onClick
}: IIconButtonProps) => (
  <button
    type="button"
    aria-label={label}
    aria-pressed={active}
    disabled={disabled}
    onClick={onClick}
    className={classNames(
      "pp-btn pp-has-tip",
      active && "pp-btn-active",
      className
    )}
  >
    <Icon name={icon} />
    <span className={classNames("pp-tip", tipPosition[tip])}>
      {label}
      {shortcut ? <kbd className="pp-kbd">{shortcut}</kbd> : null}
    </span>
  </button>
);

export default IconButton;
