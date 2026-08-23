import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NF3D Auto Bot",
  description: "Etsy-first social publishing control centre for NewForest3D",
  applicationName: "NF3D Auto Bot",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/nf3d-logo.svg", type: "image/svg+xml" }],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    title: "NF3D",
    statusBarStyle: "black-translucent",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-GB">
      <body>{children}</body>
    </html>
  );
}
