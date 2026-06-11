import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://perseoagency.net"),
  title: {
    default: "Perseo — Growth full-funnel alavancado por IA",
    template: "%s · Perseo",
  },
  description:
    "Parceiro de crescimento full-funnel para D2C e e-commerce: inteligência de concorrentes, criativos UGC em escala, landing e relatório — com proteção contra fraude.",
  openGraph: {
    siteName: "Perseo",
    locale: "pt_BR",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="min-h-dvh bg-surface-0 text-ink antialiased">{children}</body>
    </html>
  );
}
