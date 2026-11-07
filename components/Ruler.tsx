"use client";

import { useEffect, useRef, useState } from "react";

const TICKS = Array.from({ length: 101 }, (_, index) => index);

export function Ruler() {
  const railRef = useRef<HTMLDivElement>(null);
  const scaleRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const readoutRef = useRef<HTMLSpanElement>(null);
  const [scaleSpan, setScaleSpan] = useState(0);
  const metrics = useRef({ span: 0, railHeight: 0 });

  useEffect(() => {
    const root = document.documentElement;
    let frame = 0;

    const measure = () => {
      const header = Number.parseFloat(getComputedStyle(root).getPropertyValue("--header")) || 48;
      const railHeight = Math.max(0, window.innerHeight - header);
      // The official rail keeps 5% at roughly 347px on a 1000px viewport.
      // Scale to the rail, not to the document height, so a long page does not
      // stretch the tick spacing.
      const span = Math.max(0, railHeight - 24) * 7.5;
      metrics.current = { span, railHeight };
      setScaleSpan((current) => (Math.abs(current - span) > 1 ? span : current));
    };

    const update = () => {
      frame = 0;
      const max = root.scrollHeight - root.clientHeight;
      const ratio = max > 0 ? Math.min(1, Math.max(0, root.scrollTop / max)) : 0;
      const progress = ratio * 100;

      if (scaleRef.current) {
        const { span, railHeight } = metrics.current;
        const target = ratio * Math.max(0, railHeight - 24);
        scaleRef.current.style.transform = `translate3d(0, ${target - ratio * span}px, 0)`;
      }
      if (cursorRef.current) {
        cursorRef.current.style.top = `${progress}%`;
        cursorRef.current.classList.toggle("is-visible", root.scrollTop > 2);
      }
      if (readoutRef.current) {
        readoutRef.current.textContent = String(Math.round(progress)).padStart(3, "0");
      }
      scaleRef.current?.querySelectorAll<HTMLElement>(".ruler__row.is-major").forEach((row) => {
        row.classList.toggle("is-current", Math.abs(Number(row.dataset.value) - progress) < 1.5);
      });
      railRef.current?.setAttribute("aria-valuenow", String(Math.round(progress)));
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const onResize = () => {
      measure();
      update();
    };

    measure();
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    const observer = new ResizeObserver(onResize);
    observer.observe(document.body);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      observer.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      ref={railRef}
      className="ruler"
      role="scrollbar"
      aria-controls="main"
      aria-orientation="vertical"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={0}
      aria-label="Page position"
    >
      <div className="ruler__veil" aria-hidden="true" />
      <div className="ruler__scale" ref={scaleRef} style={{ height: scaleSpan }}>
        {TICKS.map((tick) => {
          const major = tick % 5 === 0;
          return (
            <div className={`ruler__row${major ? " is-major" : ""}`} style={{ top: `${tick}%` }} data-value={tick} key={tick}>
              <span className="ruler__tick" />
              {major ? <span className="ruler__num">{tick}</span> : null}
            </div>
          );
        })}
        <div className="ruler__cursor" ref={cursorRef}>
          <span className="ruler__cursor-line" />
          <span className="ruler__cursor-readout">
            <span ref={readoutRef}>000</span>
            <span className="ruler__cursor-percent">%</span>
          </span>
        </div>
      </div>
    </div>
  );
}
