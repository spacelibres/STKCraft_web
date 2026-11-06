import type { SiteContent } from "@/lib/content";

const icons = ["code", "target", "chip", "command", "drive", "globe"] as const;

export function PrinciplesSection({ principles }: { principles: SiteContent["principles"] }) {
  return (
    <section id="principles" className="section frame" aria-labelledby="principles-title">
      <header className="section-head">
        <span className="mono">{principles.kicker}</span>
        <span className="mono">{principles.meta}</span>
      </header>
      <div className="section-body principles-intro">
        <h2 id="principles-title" data-reveal>
          {principles.titleA} <span className="accent">{principles.titleB}</span>
        </h2>
        <p className="section-lede" data-reveal>{principles.lede}</p>
      </div>
      <div className="principle-grid">
        {principles.items.map((item, index) => (
          <article className="principle" key={item.index} data-reveal>
            <div className="principle__top">
              <svg className="icon" aria-hidden="true"><use href={`#i-${icons[index]}`} /></svg>
              <span className="mono">{item.index}</span>
            </div>
            <h3>{item.title}</h3>
            <p>{item.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
