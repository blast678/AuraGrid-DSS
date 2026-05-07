import type { Metadata } from "next";
import "./globals.css";
import AppShell from "@/components/layout/AppShell";

export const metadata: Metadata = {
  title: "AuraGrid | BESCOM Decision-Support Layer",
  description:
    "AuraGrid — AI-powered EV charging demand management and grid optimization platform for BESCOM, Bengaluru.",
  keywords: ["BESCOM", "AuraGrid", "EV charging", "grid optimization", "Bengaluru smart grid"],
  authors: [{ name: "BESCOM Smart Grid Division" }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
