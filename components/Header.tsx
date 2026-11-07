"use client";

import { useEffect, useState } from "react";
import type { Lang, SiteContent } from "@/lib/content";
import { ThemeToggle } from "./ThemeToggle";

type HeaderProps = {
  lang: Lang;
  nav: SiteContent["nav"];
  header: SiteContent["header"];
};

export function Header({ lang, nav, header }: HeaderProps) {
  const [open, setOpen] = useState(false);
  const base = lang === "en" ? "/" : "/zh/";

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header className="site-header">
      <a className="site-header__brand" href={`${base}#top`} aria-label="STKCraft home">
        <img src="/brand/albatross.png" alt="" width="26" height="26" />
        <span>STKCRAFT</span>
      </a>

      <nav className={`site-nav${open ? " is-open" : ""}`} id="site-nav" aria-label={nav.primary}>
        <a href={`${base}#craft`} onClick={() => setOpen(false)}>{nav.craft}</a>
        <a href={`${base}#workspace`} onClick={() => setOpen(false)}>{nav.workspace}</a>
        <a href={`${base}#family`} onClick={() => setOpen(false)}>{nav.family}</a>
        <a href={`${base}#principles`} onClick={() => setOpen(false)}>{nav.principles}</a>
        <a href={`${base}#status`} onClick={() => setOpen(false)}>{nav.status}</a>
      </nav>

      <div className="site-header__tools">
        <a
          className="tool-button"
          href={lang === "en" ? "/zh/" : "/"}
          aria-label={header.language}
          hrefLang={lang === "en" ? "zh-CN" : "en"}
        >
          {header.languageShort}
        </a>
        <ThemeToggle labels={{ light: header.themeLight, dark: header.themeDark }} />
        <a
          className="github-button"
          href="https://github.com/spacelibres/STKCraft"
          target="_blank"
          rel="noopener noreferrer"
        >
          <span>{header.github}</span> <span aria-hidden="true">↗</span>
        </a>
        <button
          className="tool-button menu-toggle"
          id="menu-toggle"
          type="button"
          aria-label={open ? nav.close : nav.menu}
          aria-controls="site-nav"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          <span aria-hidden="true">{open ? "✕" : "☰"}</span>
        </button>
      </div>
    </header>
  );
}
