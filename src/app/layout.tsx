import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Quadtroller — Drone controls",
  description: "Simple controls for Wi-Fi toy drones.",
  applicationName: "Quadtroller",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Quadtroller" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return <html lang="en"><body>{children}</body></html>;
}
