import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Suspense } from "react";
import { SiteShell } from "./components/site-shell";
import { ShellSkeleton } from "./components/shell-skeleton";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "MainAI | Industrial maintenance intelligence",
    template: "%s | MainAI",
  },
  description:
    "An industrial predictive-maintenance interface. Live monitoring requires a configured backend integration.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={geistSans.variable}
    >
      <body>
        <Suspense fallback={<ShellSkeleton />}>
          <SiteShell>{children}</SiteShell>
        </Suspense>
      </body>
    </html>
  );
}
