"use client";

import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useState } from "react";
import { CircleDollarSign, Menu, X } from "lucide-react";

export default function Navbar() {
  const { publicKey } = useWallet();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/90 backdrop-blur-lg dark:border-gray-800/50 dark:bg-gray-950/90">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <CircleDollarSign className="h-7 w-7 text-green-500" />
          <span className="text-xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            Solance<span className="text-green-500">Work</span>
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden items-center gap-8 md:flex">
          <Link
            href="/"
            className="text-sm font-medium text-gray-600 transition hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            Home
          </Link>
          <Link
            href="#services"
            className="text-sm font-medium text-gray-600 transition hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            Services
          </Link>
          {publicKey && (
            <>
              <Link
                href="/dashboard"
                className="text-sm font-medium text-gray-600 transition hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              >
                Dashboard
              </Link>
              <Link
                href="/orders"
                className="text-sm font-medium text-gray-600 transition hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              >
                Orders
              </Link>
            </>
          )}
          <WalletMultiButton />
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? (
            <X className="h-6 w-6 text-gray-700 dark:text-gray-200" />
          ) : (
            <Menu className="h-6 w-6 text-gray-700 dark:text-gray-200" />
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="border-t border-gray-100 px-4 pb-4 pt-3 dark:border-gray-800 md:hidden">
          <div className="flex flex-col gap-3">
            <Link
              href="/"
              className="text-sm font-medium text-gray-700 dark:text-gray-300"
              onClick={() => setMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              href="#services"
              className="text-sm font-medium text-gray-700 dark:text-gray-300"
              onClick={() => setMenuOpen(false)}
            >
              Services
            </Link>
            {publicKey && (
              <>
                <Link
                  href="/dashboard"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                  onClick={() => setMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  href="/orders"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                  onClick={() => setMenuOpen(false)}
                >
                  Orders
                </Link>
                <Link
                  href={`/profile/${publicKey.toBase58()}`}
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                  onClick={() => setMenuOpen(false)}
                >
                  My Profile
                </Link>
              </>
            )}
            <div className="pt-2">
              <WalletMultiButton />
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
