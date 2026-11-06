import type { SiteContent } from "@/lib/content";

export function StartSection({ start }: { start: SiteContent["start"] }) {
  return (
    <section id="start" className="section frame start-section" aria-labelledby="start-title">
      <div className="start-inner">
        <p className="mono start__kicker" data-reveal>{start.kicker}</p>
        <h2 id="start-title" data-reveal>
          {start.titleA} <span className="accent">{start.titleB}</span>
        </h2>
        <p className="section-lede start__lede" data-reveal>{start.lede}</p>
        <div className="start-actions" data-reveal>
          <a
            className="button button--primary"
            href="https://github.com/spacelibres/STKCraft"
            target="_blank"
            rel="noopener noreferrer"
          >
            {start.github} <span aria-hidden="true">↗</span>
          </a>
          <a
            className="button"
            href="https://discord.gg/artcraft"
            target="_blank"
            rel="noopener noreferrer"
          >
            {start.discord} <span aria-hidden="true">↗</span>
          </a>
          <a
            className="button"
            href="https://github.com/spacelibres/STKCraft#readme"
            target="_blank"
            rel="noopener noreferrer"
          >
            {start.source} <span aria-hidden="true">↗</span>
          </a>
        </div>
        <pre className="code-block" data-reveal><code>{start.code}</code></pre>
        <p className="mono start__footnote" data-reveal>{start.footnote}</p>
      </div>
    </section>
  );
}
