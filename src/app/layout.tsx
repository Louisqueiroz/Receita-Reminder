import type { Metadata, Viewport } from "next";
import "./globals.css";
import SWNavigation from "@/components/SWNavigation";

export const metadata: Metadata = {
  title: "Receita Reminder",
  description: "Lembrete de remedios do SUS",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#2563eb",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Receita Reminder" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className="antialiased">
        <SWNavigation />
        {children}
      </body>
    </html>
  );
}
