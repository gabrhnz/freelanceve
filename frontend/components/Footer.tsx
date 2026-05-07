"use client";

import Link from "next/link";
import { CircleDollarSign } from "lucide-react";

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="mb-4 flex items-center gap-2">
              <CircleDollarSign className="h-6 w-6 text-green-500" />
              <span className="text-lg font-extrabold tracking-tight text-gray-900 dark:text-white">
                Solance<span className="text-green-500">Work</span>
              </span>
            </Link>
            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
              The freelance marketplace powered by Solana. Fast payments, low
              fees, global reach.
            </p>
          </div>

          {/* Platform */}
          <div>
            <h4 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
              Platform
            </h4>
            <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
              <li>
                <Link href="/" className="transition hover:text-gray-900 dark:hover:text-white">
                  Home
                </Link>
              </li>
              <li>
                <Link href="#services" className="transition hover:text-gray-900 dark:hover:text-white">
                  Browse Services
                </Link>
              </li>
              <li>
                <Link href="/register" className="transition hover:text-gray-900 dark:hover:text-white">
                  Become a Freelancer
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
              Resources
            </h4>
            <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
              <li>
                <span className="cursor-default">USDC Guide</span>
              </li>
              <li>
                <span className="cursor-default">Solana Wallet Setup</span>
              </li>
              <li>
                <span className="cursor-default">Escrow Protection</span>
              </li>
              <li>
                <span className="cursor-default">Help Center</span>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
              Contact
            </h4>
            <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
              <li>
                <a
                  href="mailto:support@solancework.com"
                  className="transition hover:text-gray-900 dark:hover:text-white"
                >
                  support@solancework.com
                </a>
              </li>
              <li>
                <span className="cursor-default">Discord Community</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-gray-200 pt-6 text-center text-xs text-gray-400 dark:border-gray-800 dark:text-gray-500">
          SolanceWork — Freelancing on Solana with USDC &middot; Devnet
        </div>
      </div>
    </footer>
  );
}
