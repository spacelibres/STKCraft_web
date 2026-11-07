import type { SiteContent } from "@/lib/content";

export function FamilySection({ family }: { family: SiteContent["family"] }) {
  return (
    <section id="family" className="section frame" aria-labelledby="family-title">
      <header className="section-head">
        <span className="mono">{family.kicker}</span>
        <span className="mono">{family.meta}</span>
      </header>
      <div className="section-body family-intro">
        <h2 id="family-title" data-reveal>{family.title}</h2>
        <p className="section-lede" data-reveal>{family.lede}</p>
      </div>

      <div className="family-feature" data-reveal>
        <div className="family-feature__mark">
          <img src="/brand/albatross.png" alt="" width="128" height="128" />
        </div>
        <div className="family-feature__body">
          <span className="mono">{family.featuredNote}</span>
          <h3>{family.featuredName}</h3>
          <p>{family.featuredCategory}</p>
        </div>
        <span className="badge">{family.featuredStatus}</span>
      </div>

      <div className="family-grid">
        {family.apps.map((app, index) => {
          const slug = app.name.toLowerCase().replace(/\s+/g, "-");
          return (
            <a
              className="family-app"
              key={app.name}
              href={`https://getartcraft.com/apps/${slug}`}
              target="_blank"
              rel="noopener noreferrer"
              data-reveal
            >
              <span className="mono family-app__index">{String(index + 1).padStart(2, "0")}</span>
              <span className="family-app__arrow" aria-hidden="true">↗</span>
              <img
                className="family-app__icon"
                src={`/apps/${slug}.webp`}
                alt=""
                width="52"
                height="52"
                loading="eager"
                decoding="async"
              />
              <span className="family-app__name">{app.name}</span>
              <span className="family-app__category">{app.category}</span>
            </a>
          );
        })}
      </div>

      <div className="family-footer">
        <a
          className="text-link"
          href="https://getartcraft.com/apps"
          target="_blank"
          rel="noopener noreferrer"
        >
          {family.seeAll} <span aria-hidden="true">↗</span>
        </a>
      </div>
    </section>
  );
}
