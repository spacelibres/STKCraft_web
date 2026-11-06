"use client";

import { useEffect } from "react";

export function Ruler() {
  useEffect(() => {
    const root = document.documentElement;
    const update = () => {
      const max = root.scrollHeight - root.clientHeight;
      const ratio = max > 0 ? Math.min(1, Math.max(0, root.scrollTop / max)) : 0;
      root.style.setProperty("--progress", `${(ratio * 100).toFixed(2)}%`);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <div className="ruler" aria-hidden="true">
      <div className="ruler__progress" />
      <div className="ruler__labels">
        {Array.from({ length: 11 }, (_, index) => (
          <span key={index} style={{ top: `${index * 10}%` }}>{index * 10}</span>
        ))}
      </div>
    </div>
  );
}
