import type { Metadata, Viewport } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Terra · Cotizaciones",
  description: "Gestión privada de cotizaciones de Terra",
  robots: { index: false, follow: false },
  applicationName: "Terra",
  appleWebApp: { capable: true, title: "Terra", statusBarStyle: "default" },
};
export const viewport: Viewport = { themeColor: "#24573e" };
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
