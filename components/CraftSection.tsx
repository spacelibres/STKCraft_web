import type { SiteContent } from "@/lib/content";

export function CraftSection({ craft }: { craft: SiteContent["craft"] }) {
  return (
    <section id="craft" className="section frame" aria-labelledby="craft-title">
      <header className="section-head">
        <span className="mono">{craft.kicker}</span>
        <span className="mono">{craft.meta}</span>
      </header>
      <div className="section-body craft-intro">
        <h2 id="craft-title" data-reveal>
          {craft.titleA} <span className="accent">{craft.titleB}</span>
        </h2>
        <p className="section-lede" data-reveal>{craft.lede}</p>
      </div>
      <div className="feature-grid">
        {craft.cards.map((card) => (
          <article className="feature" key={card.index} data-reveal>
            <span className="mono feature__index">{card.index}</span>
            <h3>{card.title}</h3>
            <p>{card.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
