import type { Metadata } from "next";
import { Manrope, Bebas_Neue, Playfair_Display } from "next/font/google";
import "./globals.css";

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
  title: "WaistLess Foods - Private Chef Amber",
  description:
    "Private Chef Amber curates fresh, flavorful meals, from pescatarian feasts to hearty family dinners, with an eco-conscious touch.",
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
        {children}
      </body>
    </html>
  );
}
