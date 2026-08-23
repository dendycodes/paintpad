import React, { useEffect } from "react";
import { useRecoilState } from "recoil";
import { toastState } from "@/app/stores";

const Toast = () => {
  const [message, setMessage] = useRecoilState(toastState);

  useEffect(() => {
    if (!message) return undefined;
    const timer = setTimeout(() => setMessage(null), 2000);
    return () => clearTimeout(timer);
  }, [message, setMessage]);

  if (!message) return null;

  return (
    <div className="pointer-events-none fixed bottom-[136px] left-1/2 z-40 -translate-x-1/2 md:bottom-3 md:left-3 md:translate-x-0">
      <div className="pp-panel pp-pop px-3 py-2 text-[12.5px] font-medium text-white/85">
        {message}
      </div>
    </div>
  );
};

export default Toast;
