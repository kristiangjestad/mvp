import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Downtown VIP",
  description: "Ditt digitale VIP-pass til Club Downtown.",
  applicationName: "Downtown VIP",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Downtown VIP",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    apple: "/apple-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#000000",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="nb">
      <body>{children}</body>
    </html>
  );
}
