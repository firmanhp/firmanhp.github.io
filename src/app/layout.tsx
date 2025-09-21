import type { Metadata } from "next";
import { Open_Sans, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navigation from "./components/Navigation";
import Footer from "./components/Footer";

const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FirmanHP",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${openSans.variable} ${geistMono.variable} antialiased`} style={{backgroundColor: '#1e1e2e', color: '#cdd6f4'}}>
        <Navigation />
        <div className="min-h-screen max-w-7xl mx-auto px-4">
          <main>{children}</main>
        </div>
        <Footer />
      </body>
    </html>
  );
}
