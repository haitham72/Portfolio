import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { MotionConfig } from "motion/react";
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
        <MotionConfig reducedMotion="user">
          <SoundProvider>
            <LoadSequenceProvider>
              <LenisProvider>
                <SiteChrome>{children}</SiteChrome>
              </LenisProvider>
            </LoadSequenceProvider>
          </SoundProvider>
        </MotionConfig>
      </body>
    </html>
  );
}
