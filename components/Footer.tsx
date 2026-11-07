import type { Lang, SiteContent } from "@/lib/content";
import { ThemeToggle } from "./ThemeToggle";

type FooterProps = {
  lang: Lang;
  footer: SiteContent["footer"];
  header: SiteContent["header"];
};

function hrefFor(lang: Lang, href: string) {
  if (!href.startsWith("#")) return href;
  return lang === "en" ? `/${href}` : `/zh/${href}`;
}

export function Footer({ lang, footer, header }: FooterProps) {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="footer-grid">
          <div className="footer-brand">
            <img src="/brand/albatross.svg?v=0.1.4" alt="" width="56" height="56" />
            <p>{footer.blurb}</p>
            <span className="mono">STKCRAFT / ART CRAFT FAMILY</span>
          </div>

          {footer.columns.map((column) => (
            <nav className="footer-column" key={column.title} aria-label={column.title}>
              <p className="mono">{column.title}</p>
              {column.links.map((link) => (
                <a
                  key={`${column.title}-${link.label}`}
                  href={hrefFor(lang, link.href)}
                  {...(link.href.startsWith("http")
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                >
                  {link.label}
                </a>
              ))}
            </nav>
          ))}
        </div>

        <div className="footer-bottom">
          <span className="mono">{footer.copyright}</span>
          <span className="mono">{footer.license}</span>
          <span className="mono">{footer.free}</span>
          <div className="footer-controls">
            <a
              className="tool-button footer-control"
              href={lang === "en" ? "/zh/" : "/"}
              aria-label={header.language}
              hrefLang={lang === "en" ? "zh-CN" : "en"}
            >
              {header.languageShort}
            </a>
            <ThemeToggle labels={{ light: header.themeLight, dark: header.themeDark }} />
          </div>
        </div>
        <p className="footer-trademark mono">{footer.trademark}</p>
      </div>
    </footer>
  );
}
