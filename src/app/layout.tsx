import type { Metadata, Viewport } from "next";
import { product } from "../../config/product";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: { default: product.name, template: `%s · ${product.name}` },
  description: product.tagline,
  metadataBase: new URL(product.origin),
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang={product.defaultLocale}>
      <body>{children}</body>
    </html>
  );
}
