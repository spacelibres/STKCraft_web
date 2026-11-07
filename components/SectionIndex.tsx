"use client";

import { useEffect, useRef, useState } from "react";

type SectionIndexProps = {
  labels: {
    top: string;
    craft: string;
    workspace: string;
    family: string;
    principles: string;
    status: string;
    start: string;
    aria: string;
  };
  base: string;
};

const ids = ["top", "craft", "workspace", "family", "principles", "status", "start"] as const;

export function SectionIndex({ labels, base }: SectionIndexProps) {
  const [active, setActive] = useState<string>("top");
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const footer = document.querySelector<HTMLElement>(".site-footer");
    let frame = 0;
    const updatePosition = () => {
      frame = 0;
      const nav = navRef.current;
      if (!nav || !footer) return;
      const naturalBottom = window.innerHeight - 32;
      const footerTop = footer.getBoundingClientRect().top;
      const lift = Math.max(0, naturalBottom - (footerTop - 24));
      nav.style.transform = `translate3d(0, ${-lift}px, 0)`;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(updatePosition);
    };
    updatePosition();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    const observer = new ResizeObserver(onScroll);
    observer.observe(document.body);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      observer.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    const sections = ids
      .map((id) => document.getElementById(id))
      .filter((node): node is HTMLElement => Boolean(node));

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "-25% 0px -55% 0px", threshold: [0, 0.05, 0.2, 0.5] },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  const items = [
    { id: "top", label: labels.top },
    { id: "craft", label: labels.craft },
    { id: "workspace", label: labels.workspace },
    { id: "family", label: labels.family },
    { id: "principles", label: labels.principles },
    { id: "status", label: labels.status },
    { id: "start", label: labels.start },
  ];

  return (
    <nav ref={navRef} className="section-index" aria-label={labels.aria}>
      {items.map((item) => (
        <a
          key={item.id}
          href={`${base}#${item.id}`}
          className={active === item.id ? "is-active" : undefined}
          aria-current={active === item.id ? "true" : undefined}
        >
          {item.label}
        </a>
      ))}
    </nav>
  );
}
