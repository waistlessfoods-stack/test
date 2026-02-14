import type { Metadata } from "next";
import { Manrope, Bebas_Neue, Playfair_Display } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/lib/cart-context";
import LayoutShell from "@/components/layout/layout-shell";

const metropolis = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-metropolis",
});

const bebasNeue = Bebas_Neue({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-bebas-neue",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-playfair",
});

export const metadata: Metadata = {
  title: "WaistLess Foods | Waste Less. Taste More.",
  description:
    "Private Chef Amber curates fresh, flavorful meals, from pescatarian feasts to hearty family dinners, with an eco-conscious touch.",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    title: "WaistLess Foods | Waste Less. Taste More.",
    description:
      "Private Chef Amber curates fresh, flavorful meals, from pescatarian feasts to hearty family dinners, with an eco-conscious touch.",
    images: [
      {
        url: "/logo.png",
        width: 512,
        height: 512,
        alt: "WaistLess Foods logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "WaistLess Foods | Waste Less. Taste More.",
    description:
      "Private Chef Amber curates fresh, flavorful meals, from pescatarian feasts to hearty family dinners, with an eco-conscious touch.",
    images: ["/logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${metropolis.variable} ${bebasNeue.variable} ${playfair.variable} font-sans antialiased`}
      >
        <CartProvider>
          <LayoutShell>{children}</LayoutShell>
        </CartProvider>
      </body>
    </html>
  );
}
