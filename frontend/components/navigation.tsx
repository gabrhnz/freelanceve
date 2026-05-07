"use client";

import Link from "next/link";
import { ChevronDown, User, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useLanguage } from "@/contexts/language-context";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useState } from "react";
import { shortWallet } from "@/lib/utils";

export function Navigation() {
  const { publicKey, connected } = useWallet();
  const { t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="container mx-auto px-4 pt-8 pb-4">
      <nav className="flex items-center justify-between bg-white border-4 border-black rounded-xl px-5 py-3 max-w-5xl mx-auto shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        {/* Logo */}
        <Link
          href="/"
          className="w-10 h-10 bg-black rounded-full flex items-center justify-center flex-shrink-0"
        >
          <div className="w-6 h-6 bg-white rounded-full"></div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6 flex-1 justify-center">
          <Link
            href="/"
            className="text-[18px] font-bold leading-[20px] hover:opacity-70 transition-opacity"
          >
            {t.nav.home}
          </Link>
          <Link
            href="#services"
            className="text-[18px] font-bold leading-[20px] hover:opacity-70 transition-opacity"
          >
            {t.nav.services}
          </Link>
          <Link
            href="#about"
            className="text-[18px] font-bold leading-[20px] hover:opacity-70 transition-opacity"
          >
            {t.nav.about}
          </Link>
          {connected && (
            <Link
              href="/dashboard"
              className="text-[18px] font-bold leading-[20px] hover:opacity-70 transition-opacity"
            >
              Dashboard
            </Link>
          )}
        </div>

        {/* Desktop Auth Buttons */}
        <div className="hidden md:flex items-center gap-3 flex-shrink-0">
          <LanguageSwitcher />
          {connected && publicKey ? (
            <div className="flex items-center gap-3">
              <Link
                href={`/profile/${publicKey.toBase58()}`}
                className="flex items-center gap-2 px-3 py-2 bg-[#F5F5F5] rounded-lg border-2 border-black hover:bg-[#EBEBEB] transition-colors"
              >
                <div className="w-8 h-8 bg-[#9945FF] rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <span className="text-[14px] font-bold">
                  {shortWallet(publicKey.toBase58())}
                </span>
              </Link>
              <WalletMultiButton style={navButtonStyle} />
            </div>
          ) : (
            <WalletMultiButton style={navButtonStyle} />
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden w-10 h-10 flex items-center justify-center"
        >
          {mobileMenuOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-4 bg-white border-4 border-black rounded-xl p-5 max-w-5xl mx-auto shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex flex-col gap-4">
            <div className="flex justify-end">
              <LanguageSwitcher />
            </div>
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="text-[18px] font-bold leading-[20px] hover:opacity-70 transition-opacity"
            >
              {t.nav.home}
            </Link>
            <Link
              href="#services"
              onClick={() => setMobileMenuOpen(false)}
              className="text-[18px] font-bold leading-[20px] hover:opacity-70 transition-opacity"
            >
              {t.nav.services}
            </Link>
            <Link
              href="#about"
              onClick={() => setMobileMenuOpen(false)}
              className="text-[18px] font-bold leading-[20px] hover:opacity-70 transition-opacity"
            >
              {t.nav.about}
            </Link>
            {connected && (
              <>
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-[18px] font-bold leading-[20px] hover:opacity-70 transition-opacity"
                >
                  Dashboard
                </Link>
                <Link
                  href="/orders"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-[18px] font-bold leading-[20px] hover:opacity-70 transition-opacity"
                >
                  Orders
                </Link>
              </>
            )}

            <div className="border-t-2 border-black/10 pt-4 mt-2">
              <WalletMultiButton style={navButtonStyle} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const navButtonStyle: React.CSSProperties = {
  backgroundColor: "#0B0B0B",
  color: "white",
  borderRadius: "0.5rem",
  height: "40px",
  fontSize: "14px",
  fontWeight: 700,
  padding: "0 20px",
  border: "2px solid black",
};
