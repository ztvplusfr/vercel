import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const viewport: Viewport = {
  themeColor: "#38bdf8",
};

export const metadata: Metadata = {
  title: "ZTVPlus",
  description:
    "ZTVPlus - Votre plateforme de streaming inspirée de Netflix, propulsée par Next.js et TMDB",
  other: {
    "msapplication-navbutton-color": "#38bdf8",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
