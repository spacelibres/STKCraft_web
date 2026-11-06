import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { content } from "@/lib/content";

const c = content.en;

export const metadata: Metadata = {
  title: "404 — This orbit does not exist",
  description: "The page you were looking for is not in this scenario.",
};

export default function NotFound() {
  return (
    <>
      <Header lang="en" nav={c.nav} header={c.header} />
      <main className="not-found frame">
        <div className="not-found__inner">
          <p className="mono">404 / ORBIT NOT FOUND</p>
          <div className="not-found__code" aria-hidden="true">404</div>
          <h1>This orbit does not exist.</h1>
          <p className="section-lede">
            The page you were looking for is not in this scenario. Return to the mission, or read
            the source.
          </p>
          <div className="not-found__actions">
            <a className="button button--primary" href="/">
              Return to STKCraft <span aria-hidden="true">↗</span>
            </a>
            <a
              className="button"
              href="https://github.com/spacelibres/STKCraft"
              target="_blank"
              rel="noopener noreferrer"
            >
              View source <span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>
      </main>
      <Footer lang="en" footer={c.footer} header={c.header} />
    </>
  );
}
