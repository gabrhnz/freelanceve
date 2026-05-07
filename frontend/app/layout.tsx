import type { Metadata } from "next";
import "./globals.css";
import WalletProvider from "@/components/WalletProvider";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Toaster } from "react-hot-toast";

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
    <html lang="en" className="dark">
      <body className="min-h-screen antialiased">
        <WalletProvider>
          <Navbar />
          <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
          <Footer />
          <Toaster
            position="bottom-right"
            toastOptions={{
              className:
                "!bg-gray-900 !text-white dark:!bg-gray-800",
            }}
          />
        </WalletProvider>
      </body>
    </html>
  );
}
