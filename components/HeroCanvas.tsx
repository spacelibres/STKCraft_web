"use client";

import { useEffect, useRef } from "react";

function mulberry32(seed: number) {
  return function random() {
    let value = (seed += 0x6d2b79f5);
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function HeroCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const context = canvas.getContext("2d")!;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let visible = true;
    let theme = document.documentElement.dataset.theme === "dark" ? "dark" : "light";
    const random = mulberry32(0x53544b);
    const stars = Array.from({ length: 260 }, () => ({
      x: 0.03 + random() * 0.94,
      y: 0.03 + random() * 0.94,
      r: 0.35 + random() * 0.85,
      a: 0.18 + random() * 0.5,
    }));

    const palette = () => ({
      star: theme === "dark" ? "242,241,238" : "16,16,20",
      accent: "45,129,255",
    });

    function resize() {
      if (!canvas) return;
      const box = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(1, box.width);
      height = Math.max(1, box.height);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function drawEllipse(
      cx: number,
      cy: number,
      rx: number,
      ry: number,
      rotation: number,
      progress: number,
      opacity: number,
    ) {
      const { accent } = palette();
      context.save();
      context.translate(cx, cy);
      context.rotate(rotation);
      context.beginPath();
      context.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
      context.strokeStyle = `rgba(${accent},${opacity})`;
      context.lineWidth = 1;
      context.stroke();
      const angle = -Math.PI * 0.82 + Math.PI * 1.55 * progress;
      const dotX = Math.cos(angle) * rx;
      const dotY = Math.sin(angle) * ry;
      if (Math.abs(dotX) < rx * 0.97 && Math.abs(dotY) < ry * 0.97) {
        context.beginPath();
        context.arc(dotX, dotY, 1.8, 0, Math.PI * 2);
        context.fillStyle = `rgba(${accent},${Math.min(0.9, opacity * 4)})`;
        context.fill();
      }
      context.restore();
    }

    function render(time: number) {
      context.clearRect(0, 0, width, height);
      const { star } = palette();

      for (const point of stars) {
        const twinkle = reduced ? 1 : 0.75 + Math.sin(time / 1400 + point.x * 18) * 0.25;
        context.beginPath();
        context.arc(point.x * width, point.y * height, point.r, 0, Math.PI * 2);
        context.fillStyle = `rgba(${star},${point.a * twinkle})`;
        context.fill();
      }

      const progress = reduced ? 0.42 : (time / 18000) % 1;
      drawEllipse(width * 0.5, height * 0.46, width * 0.49, height * 0.29, -0.25, progress, 0.16);
      drawEllipse(width * 0.5, height * 0.46, width * 0.4, height * 0.22, 0.55, (progress + 0.33) % 1, 0.1);
      drawEllipse(width * 0.5, height * 0.46, width * 0.56, height * 0.36, 0.12, (progress + 0.7) % 1, 0.07);
    }

    function loop(time: number) {
      if (!visible || document.hidden) {
        frame = requestAnimationFrame(loop);
        return;
      }
      render(time);
      if (!reduced) frame = requestAnimationFrame(loop);
    }

    resize();
    render(0);
    if (!reduced) frame = requestAnimationFrame(loop);

    const observer = new ResizeObserver(() => {
      resize();
      render(performance.now());
    });
    observer.observe(canvas);

    const intersection = new IntersectionObserver(
      (entries) => {
        visible = entries[0]?.isIntersecting ?? true;
      },
      { threshold: 0 },
    );
    intersection.observe(canvas);

    const mutation = new MutationObserver(() => {
      theme = document.documentElement.dataset.theme === "dark" ? "dark" : "light";
      render(performance.now());
    });
    mutation.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      intersection.disconnect();
      mutation.disconnect();
    };
  }, []);

  return <canvas ref={ref} className="hero__canvas" aria-hidden="true" />;
}

