import type { Metadata } from "next";

import Footer from "./../shared/components/footer/footer";
import Header from "./../shared/components/header/header";
import DebugPanel from "./../shared/components/debugPanel/debugPanel";
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
            rel='preconnect'
            href='https://fonts.googleapis.com'
            crossOrigin='anonymous'
          />
          <link
            rel='preconnect'
            href='https://fonts.gstatic.com'
            crossOrigin='anonymous'
          />
          {/* eslint-disable-next-line @next/next/no-sync-scripts */}
          <script src="https://www.google.com/recaptcha/enterprise.js?render=6LcE5XUtAAAAAN8ifK1vGtE3aLVcjrdk7I9IxOMg" async defer />
        </head>
        <body>
          <AuthProvider>
            <Header />
            <main className='main-container container mx-auto select-none'>
              {children}
            </main>
            <Footer />
            <DebugPanel />
          </AuthProvider>
        </body>
      </html>
    </>
  );
}
