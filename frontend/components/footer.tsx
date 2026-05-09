import Link from "next/link";
import { ExternalLink } from "lucide-react";

const linkClass = "text-[#666] text-xs font-medium hover:text-black transition-colors";
const extClass = "text-[#666] text-xs font-medium hover:text-black transition-colors inline-flex items-center gap-1";

export function Footer() {
  return (
    <footer className="bg-white border-t-2 border-black/10 mt-8">
      <div className="container mx-auto px-4 py-5 max-w-5xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          {/* Left: brand + links */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link href="/" className="flex items-center gap-1.5 shrink-0">
              <div className="w-6 h-6 bg-black rounded-md flex items-center justify-center">
                <span className="text-white text-[10px] font-bold">W</span>
              </div>
              <span className="text-sm font-bold">Wira</span>
              <span className="text-[9px] font-bold text-[#14F195] bg-[#14F195]/10 rounded px-1.5 py-0.5">Devnet</span>
            </Link>
            <span className="hidden md:inline text-black/20">|</span>
            <Link href="/marketplace" className={linkClass}>Marketplace</Link>
            <Link href="/dashboard" className={linkClass}>Dashboard</Link>
            <Link href="/register" className={linkClass}>Registro</Link>
            <Link href="/terms" className={linkClass}>Términos</Link>
          </div>

          {/* Right: external links */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <a href="https://explorer.solana.com/address/6zjwrFhvtcub6FYvb3kZCGTXLT3pzH2fQmyjFhM5WQSb?cluster=devnet" target="_blank" rel="noopener noreferrer" className={extClass}>
              Programa <ExternalLink className="w-2.5 h-2.5" />
            </a>
            <a href="https://faucet.solana.com/" target="_blank" rel="noopener noreferrer" className={extClass}>
              Faucet SOL <ExternalLink className="w-2.5 h-2.5" />
            </a>
            <a href="https://faucet.circle.com/" target="_blank" rel="noopener noreferrer" className={extClass}>
              Faucet USDC <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
        </div>

        {/* Bottom row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mt-4 pt-3 border-t border-black/5">
          <p className="text-[#999] text-[10px] font-medium">
            &copy; {new Date().getFullYear()} Wira &middot; Powered by Solana
          </p>
          <div className="flex items-center gap-2">
            <a href="https://github.com/gabrhnz/wira" target="_blank" rel="noopener noreferrer"
              className="w-6 h-6 bg-black rounded-md flex items-center justify-center hover:opacity-80 transition-opacity">
              <svg viewBox="0 0 24 24" className="w-3 h-3 fill-white" aria-hidden="true">
                <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
            </a>
            <a href="https://x.com/gabrhnz" target="_blank" rel="noopener noreferrer"
              className="w-6 h-6 bg-black rounded-md flex items-center justify-center hover:opacity-80 transition-opacity">
              <svg viewBox="0 0 24 24" className="w-2.5 h-2.5 fill-white" aria-hidden="true">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
