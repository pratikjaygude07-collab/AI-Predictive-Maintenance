import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { SiteShell } from "./components/site-shell";
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
    "A software-only demonstration of predictive maintenance monitoring for industrial machinery.",
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
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
