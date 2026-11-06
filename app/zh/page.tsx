import type { Metadata } from "next";
import { SitePage } from "@/components/SitePage";
import { content } from "@/lib/content";

const c = content.zh;

export const metadata: Metadata = {
  title: "开源空间任务分析",
  description: c.meta.description,
  alternates: {
    canonical: "/zh/",
    languages: { en: "/", "zh-CN": "/zh/", "x-default": "/" },
  },
  openGraph: {
    type: "website",
    siteName: "STKCraft",
    title: c.meta.ogTitle,
    description: c.meta.ogDescription,
    url: "https://www.stkscraft.com/zh/",
    locale: "zh_CN",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: c.meta.ogTitle }],
  },
  twitter: {
    card: "summary_large_image",
    title: c.meta.ogTitle,
    description: c.meta.ogDescription,
    images: ["/og.png"],
  },
};

export default function ZhPage() {
  return <SitePage lang="zh" />;
}
