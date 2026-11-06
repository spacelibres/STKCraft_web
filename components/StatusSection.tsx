import type { SiteContent } from "@/lib/content";

export function StatusSection({ status }: { status: SiteContent["status"] }) {
  return (
    <section id="status" className="section frame" aria-labelledby="status-title">
      <header className="section-head">
        <span className="mono">{status.kicker}</span>
        <span className="mono">{status.meta}</span>
      </header>
      <div className="section-body status-intro">
        <h2 id="status-title" data-reveal>
          {status.titleA} <span className="accent">{status.titleB}</span>
        </h2>
        <p className="section-lede" data-reveal>{status.lede}</p>
      </div>

      <div className="status-grid">
        <div className="status-column" data-reveal>
          <div className="status-column__head">
            <span className="mono">01</span>
            <h3>{status.shippedTitle}</h3>
          </div>
          <ul>
            {status.shipped.map((item) => (
              <li key={item}>
                <span className="status-mark status-mark--yes" aria-hidden="true">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="status-column" data-reveal>
          <div className="status-column__head">
            <span className="mono">02</span>
            <h3>{status.nextTitle}</h3>
          </div>
          <ul>
            {status.next.map((item) => (
              <li key={item}>
                <span className="status-mark status-mark--next" aria-hidden="true">→</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="status-callout" data-reveal>
        <div>
          <p className="mono">{status.calloutTitle}</p>
          <p className="status-callout__body">{status.calloutBody}</p>
        </div>
        <div className="status-callout__actions">
          <a
            className="button button--primary"
            href="https://github.com/spacelibres/STKCraft"
            target="_blank"
            rel="noopener noreferrer"
          >
            {status.calloutLink} <span aria-hidden="true">↗</span>
          </a>
          <a
            className="button"
            href="https://github.com/spacelibres/STKCraft/releases"
            target="_blank"
            rel="noopener noreferrer"
          >
            {status.releasesLink} <span aria-hidden="true">↗</span>
          </a>
        </div>
      </div>

      <div className="evidence-strip">
        {status.evidence.map((item) => (
          <span className="mono" key={item}>{item}</span>
        ))}
      </div>
    </section>
  );
}
