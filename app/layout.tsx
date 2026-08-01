import type { Metadata } from "next";
import Script from "next/script";
import Header from "@/components/Header";
import "./globals.css";

export const metadata: Metadata = {
  title: "StreetGame — le réseau des joueurs mobile",
  description:
    "Rejoins la communauté de ton jeu, relève des défis, grimpe le classement et échange tes points contre de vraies récompenses en jeu.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body style={{ minHeight: "100vh", background: "var(--color-bg)", color: "var(--color-text)" }}>
        <Script src="https://unpkg.com/@phosphor-icons/web" strategy="beforeInteractive" />
        <Header />
        {children}
      </body>
    </html>
  );
}
