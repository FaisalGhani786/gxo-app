import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Outfit } from "next/font/google";
import Header from "@/components/Header";
import MotionProvider from "@/components/MotionProvider";
import { getSession } from "@/lib/supabase/server";
import "./globals.css";

const outfit = Outfit({ variable: "--font-outfit", subsets: ["latin"], weight: ["600", "700", "800", "900"] });
const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: "gxoeditz! — Short-form editing courses & 1-1 mentoring", template: "%s · gxoeditz!" },
  description:
    "Learn to edit scroll-stopping shorts in Premiere Pro and CapCut. Courses, 1-1 mentoring and a Discord community from gxoeditz.",
  openGraph: { images: ["/brand/banner.jpg"] },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#ffffff" };

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const { user, profile } = await getSession();
  return (
    <html lang="en-GB" className={`${outfit.variable} ${geist.variable} ${geistMono.variable}`}>
      <body>
        <MotionProvider>
          <Header signedIn={!!user} isAdmin={!!profile?.is_admin} />
          {children}
        </MotionProvider>
      </body>
    </html>
  );
}
