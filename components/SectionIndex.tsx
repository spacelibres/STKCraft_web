"use client";

import { useEffect, useState } from "react";

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
    <nav className="section-index" aria-label={labels.aria}>
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
