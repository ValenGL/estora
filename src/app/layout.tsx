import type { Metadata } from "next";

import Footer from "./../shared/components/footer/footer";
import Header from "./../shared/components/header/header";
import "./globals.scss";
import { AuthProvider } from "./utils/isAuth";

import { DM_Sans } from "next/font/google";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
  subsets: ["latin"],
});
export const metadata: Metadata = {
  title: "Brokerage",
  description: "Brokerage",
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
        className={`${dmSans.variable}`}
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
