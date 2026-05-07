import type { Metadata } from "next";
import { Onest } from "next/font/google";
import "./globals.css";
import WalletProvider from "@/components/WalletProvider";
import { LanguageProvider } from "@/contexts/language-context";
import { Toaster } from "react-hot-toast";

const onest = Onest({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-onest",
});

export const metadata: Metadata = {
  title: "SolanceWork — Freelance Marketplace | Pay with USDC on Solana",
  description:
    "The first freelance marketplace powered by Solana. Fast transactions, low fees, and secure payments with USDC stablecoin.",
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
            {children}
            <Toaster
              position="bottom-right"
              toastOptions={{
                className: "!bg-black !text-white !border-2 !border-white",
              }}
            />
          </WalletProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
