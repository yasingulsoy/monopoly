import type { Metadata } from "next";
import { Josefin_Sans } from "next/font/google";
import "./globals.css";

// ITC Kabel (resmi Monopoly Deal fontu) ticari bir font.
// Josefin Sans aynı 1920'ler geometrik sans ailesinden, ücretsiz ve Türkçe karakterleri destekliyor.
const display = Josefin_Sans({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "İstanbul Monopoly Deal",
  description: "İstanbul ilçeleri temalı online Monopoly Deal",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className={display.variable}>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
