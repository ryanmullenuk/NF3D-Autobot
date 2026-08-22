import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NF3D Auto Bot",
  description: "Etsy-first social publishing control centre for NewForest3D",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-GB">
      <body>{children}</body>
    </html>
  );
}
