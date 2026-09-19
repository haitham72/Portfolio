import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { MotionConfig } from "motion/react";
import { Analytics } from "@vercel/analytics/next";
import LenisProvider from "@/components/chrome/LenisProvider";
import LoadSequenceProvider from "@/components/chrome/LoadSequenceProvider";
import SoundProvider from "@/components/chrome/SoundProvider";
import SiteChrome from "@/components/chrome/SiteChrome";
import { SITE } from "@/lib/placeholders";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: `${SITE.brand} — ${SITE.title}`,
  description: `${SITE.tagline}. 12+ years behind the frame.`,
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full`}>
      <body className="min-h-full bg-bg text-text antialiased" suppressHydrationWarning>
        {/* These pinned sections (Hero, Selected Work, Reels) only make sense
            entered from the top. Every nav link points at an in-page hash
            like #reels — reload or revisit a URL carrying one and the
            BROWSER's own native fragment-scroll jumps straight there before
            React hydrates (and before LenisProvider's own reset can run),
            which is how the site once opened on Reels instead of Hero.
            `beforeInteractive` hoists this into <head> and runs it, blocking,
            before <body> is even parsed — so the hash is gone from the URL
            before the target element exists for the browser to jump to. */}
        <Script id="strip-scroll-hash" strategy="beforeInteractive">
          {`try{if('scrollRestoration' in history){history.scrollRestoration='manual';}if(location.hash){history.replaceState(null,'',location.pathname+location.search);}}catch(e){}`}
        </Script>
        <MotionConfig reducedMotion="user">
          <SoundProvider>
            <LoadSequenceProvider>
              <LenisProvider>
                <SiteChrome>{children}</SiteChrome>
              </LenisProvider>
            </LoadSequenceProvider>
          </SoundProvider>
        </MotionConfig>
        <Analytics />
      </body>
    </html>
  );
}
