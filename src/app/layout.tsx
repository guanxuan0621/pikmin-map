import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pikmin Mushroom Map",
  description: "Community-driven mushroom map and observation API.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
