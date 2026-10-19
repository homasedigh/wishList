import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "wishful — Your world, wishlisted",
  description: "Collect things you love from anywhere. Organise your wishes, build gift lists, and share them with people who matter.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  openGraph: { title: "wishful — Your world, wishlisted", description: "One beautiful place for everything on your wishlist.", type: "website" }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
