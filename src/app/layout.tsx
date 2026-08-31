import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Billetera Lightning · WDK",
  description: "Billetera Lightning real construida con WDK Spark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
