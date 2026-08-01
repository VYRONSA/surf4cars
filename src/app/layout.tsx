import type { Metadata, Viewport } from "next";
import { Inter, Geist_Mono } from "next/font/google";

import { APP_DESCRIPTION, APP_NAME } from "@/constants";
import { AppProviders } from "@/providers";

import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3003",
  ),
  robots: {
    index: true,
    follow: true,
  },
  /*
    Icons come from `src/app/favicon.ico` alone.
    ==========================================
    This block used to override it with `/images/branding/logo-main.webp` — a **1.4 MB** image,
    fetched on every page load, to draw a 32px icon. It was also declared as the `apple-touch-icon`,
    which Safari ignores because that slot requires a PNG; adding the site to a home screen produced
    a screenshot of the page rather than the brand.

    Next serves the co-located `favicon.ico` (26 KB) automatically. A proper 180px PNG for
    `apple-touch-icon` is a design asset that does not exist yet, and declaring one that does not
    work is worse than declaring none.
  */
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    /*
      Must track `--color-background`.
      ==============================
      This was `#080808` — the near-black from before the palette moved to slate. The page has been
      `#1a1f28` for several programmes, so on iOS and Android the browser chrome rendered a
      near-black band directly above a slate page: a visible seam across the top of every mobile
      screen, on the surface a customer looks at most.
    */
    { color: "#1a1f28" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
