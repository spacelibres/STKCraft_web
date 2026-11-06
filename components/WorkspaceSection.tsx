import type { SiteContent } from "@/lib/content";
import { MissionConsole } from "./MissionConsole";

export function WorkspaceSection({ workspace }: { workspace: SiteContent["workspace"] }) {
  return (
    <section id="workspace" className="section frame" aria-labelledby="workspace-title">
      <header className="section-head">
        <span className="mono">{workspace.kicker}</span>
        <span className="mono">{workspace.meta}</span>
      </header>
      <div className="section-body workspace-intro">
        <h2 id="workspace-title" data-reveal>{workspace.title}</h2>
        <p className="section-lede" data-reveal>{workspace.lede}</p>
      </div>
      <div className="workspace-shell" data-reveal>
        <MissionConsole copy={workspace.console} />
      </div>
      <div className="annotations">
        {workspace.annotations.map((annotation) => (
          <div className="annotation" key={annotation.label} data-reveal>
            <p className="mono">{annotation.label}</p>
            <p>{annotation.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
