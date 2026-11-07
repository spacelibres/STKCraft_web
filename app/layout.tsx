import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

const archivo = localFont({
  src: "./fonts/archivo-latin.woff2",
  variable: "--font-archivo",
  weight: "100 900",
  display: "swap",
  declarations: [{ prop: "font-stretch", value: "62% 125%" }],
});

const inter = localFont({
  src: "./fonts/inter-latin.woff2",
  variable: "--font-inter",
  weight: "100 900",
  display: "swap",
});

const instrument = localFont({
  src: [
    { path: "./fonts/instrument-serif-latin.woff2", weight: "400", style: "normal" },
    { path: "./fonts/instrument-serif-italic-latin.woff2", weight: "400", style: "italic" },
  ],
  variable: "--font-instrument",
  display: "swap",
});

const geistMono = localFont({
  src: "./fonts/geist-mono-latin.woff2",
  variable: "--font-geist-mono",
  weight: "100 900",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.stkscraft.com"),
  title: {
    default: "STKCraft — Space mission analysis, in the open",
    template: "%s — STKCraft",
  },
  description:
    "STKCraft is open-source space mission analysis. Build a scenario of satellites, ground stations, sensors and targets, propagate it, and see exactly when one can see another.",
  applicationName: "STKCraft",
  authors: [{ name: "ArtCraft Team", url: "https://getartcraft.com" }],
  creator: "ArtCraft Team",
  publisher: "ArtCraft Team",
  other: { license: "MIT OR Apache-2.0" },
  alternates: {
    canonical: "/",
    languages: {
      en: "/",
      "zh-CN": "/zh/",
      "x-default": "/",
    },
  },
  openGraph: {
    type: "website",
    siteName: "STKCraft",
    title: "STKCraft — Know when the sky opens.",
    description:
      "Open-source space mission analysis. Build the scenario, propagate the orbit, and read the access window.",
    url: "https://www.stkscraft.com/",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "STKCraft — Know when the sky opens.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "STKCraft — Know when the sky opens.",
    description:
      "Open-source space mission analysis. Pure Rust. Native. Agent-ready.",
    images: ["/og.png"],
  },
  icons: {
    icon: [{ url: "/icon.png", type: "image/png", sizes: "512x512" }],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  manifest: "/site.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f2f1ee" },
    { media: "(prefers-color-scheme: dark)", color: "#121316" },
  ],
  colorScheme: "light dark",
};

const themeScript = `
(function () {
  try {
    document.documentElement.classList.add('js');
    var stored = localStorage.getItem('stk-theme');
    var dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.dataset.theme = stored || (dark ? 'dark' : 'light');
    if (location.pathname === '/zh' || location.pathname.indexOf('/zh/') === 0) {
      document.documentElement.lang = 'zh-CN';
    }
  } catch (_) {}
})();
`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${archivo.variable} ${inter.variable} ${instrument.variable} ${geistMono.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
