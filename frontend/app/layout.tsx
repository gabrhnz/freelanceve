import type { Metadata } from "next";
import { Onest } from "next/font/google";
import "./globals.css";
import WalletProvider from "@/components/WalletProvider";
import { LanguageProvider } from "@/contexts/language-context";
import { SessionProvider } from "@/contexts/session-context";
import { Toaster } from "react-hot-toast";
import { Footer } from "@/components/footer";

const onest = Onest({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-onest",
});

export const metadata: Metadata = {
  title: "Wira — Freelance Marketplace on Solana | Pay with USDC",
  description:
    "Wira is a decentralized freelance marketplace powered by Solana. Fast transactions, low fees, and secure escrow payments with USDC.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${onest.variable} font-sans antialiased overflow-x-hidden`}>
        <LanguageProvider>
          <WalletProvider>
            <SessionProvider>
              {children}
              <Footer />
              <Toaster
                position="bottom-right"
                toastOptions={{
                  className: "!bg-black !text-white !border-2 !border-white",
                }}
              />
            </SessionProvider>
          </WalletProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
