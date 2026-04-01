import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Hormuz Signal Tracker",
  description:
    "4 signals. Zero noise. Track the Strait of Hormuz crisis.",
  openGraph: {
    title: "Hormuz Signal Tracker",
    description:
      "4 signals. Zero noise. Track the Strait of Hormuz crisis.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Hormuz Signal Tracker",
    description:
      "4 signals. Zero noise. Track the Strait of Hormuz crisis.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} dark h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
