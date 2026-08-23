import { useEffect, useRef, useState } from "react";

/** Click-outside + Escape aware popover state. */
export const usePopover = <T extends HTMLElement>() => {
  const ref = useRef<T>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as globalThis.Node)) {
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

  return { ref, open, setOpen, toggle: () => setOpen((prev) => !prev) };
};
