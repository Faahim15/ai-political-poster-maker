import type { Metadata } from "next";
import { Hind_Siliguri, Noto_Serif_Bengali } from "next/font/google";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import "./globals.css";

const ui = Hind_Siliguri({
  subsets: ["bengali", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-ui",
});
const serif = Noto_Serif_Bengali({
  subsets: ["bengali", "latin"],
  weight: ["700", "800"],
  variable: "--font-serif",
});

export const metadata: Metadata = {
  title: "পোস্টার ঘর — ছাপার উপযোগী রাজনৈতিক পোস্টার",
  description: "নাম, পদবি ও ছবি দিয়ে এক মিনিটে বিজয় দিবস, শোক, প্রচার বা শুভেচ্ছার পোস্টার তৈরি করুন।",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bn" className={`${ui.variable} ${serif.variable}`}>
      <body className="flex min-h-screen flex-col font-sans antialiased">
        <Nav />
        <div className="flex-1">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
