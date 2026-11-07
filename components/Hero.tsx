import type { SiteContent } from "@/lib/content";
import { HeroCanvas } from "./HeroCanvas";

export function Hero({ hero }: { hero: SiteContent["hero"] }) {
  return (
    <section id="top" className="hero frame" aria-labelledby="hero-title">
      <HeroCanvas />
      <div className="hero__clear" aria-hidden="true" />
      <div className="hero__cue" aria-hidden="true">
        <span className="mono">Scroll</span>
        <span className="hero__cue-line" />
        <span className="mono">00—100</span>
      </div>
      <div className="hero__inner">
        <p className="mono hero__eyebrow" data-reveal>{hero.eyebrow}</p>
        <div className="hero__wordmark" role="img" aria-label={hero.wordmark} data-reveal>
          {hero.wordmark}
        </div>
        <h1 id="hero-title" data-reveal>{hero.title}</h1>
        <p className="hero__lede" data-reveal>{hero.lede}</p>
        <div className="hero__actions" data-reveal>
          <a className="button button--primary" href="#craft">
            {hero.primary} <span aria-hidden="true">↓</span>
          </a>
          <a
            className="button"
            href="https://github.com/spacelibres/STKCraft"
            target="_blank"
            rel="noopener noreferrer"
          >
            {hero.secondary} <span aria-hidden="true">↗</span>
          </a>
        </div>
        <p className="mono hero__meta" data-reveal>{hero.meta}</p>
        <p className="hero__by" data-reveal>{hero.by}</p>
      </div>
    </section>
  );
}
