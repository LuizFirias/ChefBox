import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";

import { RegisterServiceWorker } from "@/components/pwa/register-service-worker";
import { SiteHeader } from "@/components/shared/site-header";
import { APP_DESCRIPTION, APP_NAME } from "@/lib/config";

import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  applicationName: APP_NAME,
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/Apple-touch-icon-180x180.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#f7f9fb",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      data-scroll-behavior="smooth"
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[#F7F9FB] text-[#2D3142]">
        {process.env.NODE_ENV !== "production" ? (
          <Script id="chefbox-clear-dev-sw" strategy="beforeInteractive">
            {`(() => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => registration.unregister());
    });
  }

  if ('caches' in window) {
    caches.keys().then((keys) => {
      keys.forEach((key) => caches.delete(key));
    });
  }
})();`}
          </Script>
        ) : null}
        <div className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-96 bg-[radial-gradient(circle_at_top,rgba(255,107,53,0.10),transparent_58%)]" />
        <div className="pointer-events-none fixed inset-x-0 bottom-0 -z-10 h-72 bg-[radial-gradient(circle_at_bottom,rgba(77,124,79,0.10),transparent_60%)]" />
        <div className="flex min-h-screen flex-col">
          <SiteHeader />
          {children}
        </div>
        <RegisterServiceWorker />
      </body>
    </html>
  );
}
