import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Diagnostics",
};

export default function DiagnosticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}