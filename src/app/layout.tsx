import type { Metadata, Viewport } from "next";
import { product } from "../../config/product";
import { DEFAULT_THEME, themeScript } from "@/shell/theme";
import "@/styles/globals.css";
import "@/tutor/ui/tutor-effects.css";

export const metadata: Metadata = {
  title: { default: product.name, template: `%s · ${product.name}` },
  description: product.tagline,
  metadataBase: new URL(product.origin),
  manifest: "/site.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // data-theme is set before first paint by the inline script, so React must not "fix" it on hydration.
    <html lang={product.defaultLocale} data-theme={DEFAULT_THEME} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
