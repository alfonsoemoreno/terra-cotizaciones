import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Terra · Cotizaciones",
  description: "Gestión privada de cotizaciones de Terra",
  robots: { index: false, follow: false },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
