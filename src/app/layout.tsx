import type { Metadata } from "next";
import { Bricolage_Grotesque, Bungee } from "next/font/google";
import "./globals.css";

const bodyFont = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-body" });
const displayFont = Bungee({ subsets: ["latin"], weight: "400", variable: "--font-display" });

export const metadata: Metadata = {
  title: "NF3D Auto Bot",
  description: "Etsy-first social publishing control centre for NewForest3D",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-GB" className={`${bodyFont.variable} ${displayFont.variable}`}>
      <body>{children}</body>
    </html>
  );
}
