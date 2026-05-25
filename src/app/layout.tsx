import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "İstanbul Monopoly Deal",
  description: "İstanbul ilçeleri temalı online Monopoly Deal",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
