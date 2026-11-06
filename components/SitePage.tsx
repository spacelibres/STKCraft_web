import type { Lang, SiteContent } from "@/lib/content";
import { content } from "@/lib/content";
import { Header } from "./Header";
import { Hero } from "./Hero";
import { CraftSection } from "./CraftSection";
import { WorkspaceSection } from "./WorkspaceSection";
import { FamilySection } from "./FamilySection";
import { PrinciplesSection } from "./PrinciplesSection";
import { StatusSection } from "./StatusSection";
import { StartSection } from "./StartSection";
import { Footer } from "./Footer";
import { SectionIndex } from "./SectionIndex";
import { Ruler } from "./Ruler";
import { RevealController } from "./RevealController";

function Sprite() {
  return (
    <svg className="svg-sprite" aria-hidden="true" width="0" height="0">
      <symbol id="i-code" viewBox="0 0 24 24">
        <path d="m8 7-5 5 5 5M16 7l5 5-5 5M14 4l-4 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </symbol>
      <symbol id="i-target" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="7" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="12" cy="12" r="2.5" fill="currentColor" />
        <path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </symbol>
      <symbol id="i-chip" viewBox="0 0 24 24">
        <rect x="6" y="6" width="12" height="12" rx="1" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </symbol>
      <symbol id="i-command" viewBox="0 0 24 24">
        <rect x="3" y="4" width="18" height="16" rx="1" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="m7 9 4 3-4 3M13 15h4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </symbol>
      <symbol id="i-drive" viewBox="0 0 24 24">
        <rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M7 15h.01M11 15h2M3 10h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </symbol>
      <symbol id="i-globe" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M3 12h18M12 3c2.5 2.5 3.5 5.7 3.5 9s-1 6.5-3.5 9M12 3C9.5 5.5 8.5 8.7 8.5 12s1 6.5 3.5 9" fill="none" stroke="currentColor" strokeWidth="1.5" />
      </symbol>
    </svg>
  );
}

export function SitePage({ lang }: { lang: Lang }) {
  const c = content[lang];
  const base = lang === "en" ? "/" : "/zh/";
  const schema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "STKCraft",
    applicationCategory: "ScienceApplication",
    operatingSystem: "macOS, Windows, Linux, FreeBSD, Web",
    url: "https://www.stkscraft.com/",
    codeRepository: "https://github.com/spacelibres/STKCraft",
    license: "https://github.com/spacelibres/STKCraft/blob/main/LICENSE-APACHE",
    description: c.meta.description,
    author: { "@type": "Organization", name: "ArtCraft Team", url: "https://getartcraft.com/" },
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  };

  return (
    <>
      <a className="skip-link" href="#main">{c.nav.skip}</a>
      <Sprite />
      <Header lang={lang} nav={c.nav} header={c.header} />
      <main id="main">
        <Hero hero={c.hero} />
        <CraftSection craft={c.craft} />
        <WorkspaceSection workspace={c.workspace} />
        <FamilySection family={c.family} />
        <PrinciplesSection principles={c.principles} />
        <StatusSection status={c.status} />
        <StartSection start={c.start} />
      </main>
      <Footer lang={lang} footer={c.footer} header={c.header} />
      <SectionIndex
        base={base}
        labels={{
          top: c.hero.wordmark,
          craft: c.nav.craft,
          workspace: c.nav.workspace,
          family: c.nav.family,
          principles: c.nav.principles,
          status: c.nav.status,
          start: c.nav.start,
          aria: c.nav.sections,
        }}
      />
      <Ruler />
      <RevealController />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
    </>
  );
}
