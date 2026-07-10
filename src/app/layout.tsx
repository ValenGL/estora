import type { Metadata } from "next";

import Footer from "./../shared/components/footer/footer";
import Header from "./../shared/components/header/header";
import "./globals.scss";
import { AuthProvider } from "./utils/isAuth";

import { Alata, Caveat, Caveat_Brush } from "next/font/google";

const alata = Alata({
  variable: "--font-alata",
  weight: "400",
  display: "swap",
  subsets: ["latin"],
});

const caveat = Caveat({
  variable: "--font-caveat",
  weight: ["400", "500", "600", "700"],
  display: "swap",
  subsets: ["latin"],
});

const caveatBrush = Caveat_Brush({
  variable: "--font-caveat-brush",
  weight: "400",
  display: "swap",
  subsets: ["latin"],
});
export const metadata: Metadata = {
  title: "ESTORA",
  description: "Auto generated CRM",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <html
        lang='en'
        className={`${alata.variable} ${caveat.variable} ${caveatBrush.variable}`}
      >
        <head>
          <link
            rel='preload'
            href='/assets/images/estora-hero-poster.webp'
            as='image'
            type='image/webp'
            fetchPriority='high'
          />
          <link
            rel='preload'
            href='/assets/images/estora-hero.mp4'
            as='video'
            type='video/mp4'
            fetchPriority='high'
          />
          <link
            rel='preconnect'
            href='https://fonts.googleapis.com'
            crossOrigin='anonymous'
          />
          <link
            rel='preconnect'
            href='https://fonts.gstatic.com'
            crossOrigin='anonymous'
          />
        </head>
        <body>
          <AuthProvider>
            <Header />
            <main className='main-container container mx-auto select-none'>
              {children}
            </main>
            <Footer />
          </AuthProvider>
        </body>
      </html>
    </>
  );
}
