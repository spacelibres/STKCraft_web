import type { Metadata } from "next";
import { SitePage } from "@/components/SitePage";
import { content } from "@/lib/content";

const c = content.en;

export const metadata: Metadata = {
  title: c.meta.title,
  description: c.meta.description,
  alternates: {
    canonical: "/",
    languages: { en: "/", "zh-CN": "/zh/", "x-default": "/" },
  },
  openGraph: {
    type: "website",
    siteName: "STKCraft",
    title: c.meta.ogTitle,
    description: c.meta.ogDescription,
    url: "https://www.stkcraft.com/",
    locale: "en_US",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: c.meta.ogTitle }],
  },
  twitter: {
    card: "summary_large_image",
    title: c.meta.ogTitle,
    description: c.meta.ogDescription,
    images: ["/og.png"],
  },
};

export default function Page() {
  return <SitePage lang="en" />;
}
