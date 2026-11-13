import type { SiteContent } from "@/lib/content";

export function ModulesSection({ modules }: { modules: SiteContent["modules"] }) {
  return (
    <section id="modules" className="section frame" aria-labelledby="modules-title">
      <header className="section-head">
        <span className="mono">{modules.kicker}</span>
        <span className="mono">{modules.meta}</span>
      </header>
      <div className="section-body craft-intro">
        <h2 id="modules-title" data-reveal>{modules.title}</h2>
        <p className="section-lede" data-reveal>{modules.lede}</p>
      </div>
      <div className="modules-grid">
        {modules.items.map((item) => (
          <article className="module" key={item.name} data-reveal>
            <p className="mono module__kind">{item.kind}</p>
            <h3>{item.name}</h3>
            <p className="module__description">{item.description}</p>
            <div className="module__actions">
              {item.online && (
                <a className="button button--primary" href="https://geocalc.stkcraft.com/">
                  {modules.open} <span aria-hidden="true">↗</span>
                </a>
              )}
              <a className="button" href={item.source} target="_blank" rel="noopener noreferrer">
                {modules.source} <span className="sr-only">{item.name}</span> <span aria-hidden="true">↗</span>
              </a>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
