import Link from "next/link";
import { ExternalLink } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-white border-t-4 border-black">
      <div className="container mx-auto px-4 py-10 max-w-5xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-black rounded-lg border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <span className="text-white text-sm font-bold">W</span>
              </div>
              <span className="text-xl font-bold">Wira</span>
            </div>
            <p className="text-[#393939] text-xs font-medium leading-relaxed mb-3">
              Marketplace freelance descentralizado. Pagos con USDC en Solana.
            </p>
            <span className="inline-flex items-center gap-1.5 bg-[#14F195]/10 border-2 border-black rounded-lg px-2.5 py-1 text-[10px] font-bold">
              <span className="w-1.5 h-1.5 bg-[#14F195] rounded-full animate-pulse" />
              Solana Devnet
            </span>
          </div>

          {/* Platform */}
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider mb-4">Plataforma</h4>
            <ul className="space-y-2">
              <li><Link href="/marketplace" className="text-[#393939] text-sm font-medium hover:text-black hover:underline transition-colors">Marketplace</Link></li>
              <li><Link href="/register" className="text-[#393939] text-sm font-medium hover:text-black hover:underline transition-colors">Registro</Link></li>
              <li><Link href="/dashboard" className="text-[#393939] text-sm font-medium hover:text-black hover:underline transition-colors">Dashboard</Link></li>
              <li><Link href="/services/new" className="text-[#393939] text-sm font-medium hover:text-black hover:underline transition-colors">Publicar Servicio</Link></li>
            </ul>
          </div>

          {/* Solana */}
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider mb-4">Solana</h4>
            <ul className="space-y-2">
              <li>
                <a href="https://explorer.solana.com/address/6zjwrFhvtcub6FYvb3kZCGTXLT3pzH2fQmyjFhM5WQSb?cluster=devnet" target="_blank" rel="noopener noreferrer"
                  className="text-[#393939] text-sm font-medium hover:text-black hover:underline transition-colors inline-flex items-center gap-1">
                  Programa <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a href="https://phantom.app" target="_blank" rel="noopener noreferrer"
                  className="text-[#393939] text-sm font-medium hover:text-black hover:underline transition-colors inline-flex items-center gap-1">
                  Phantom <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a href="https://solana.com" target="_blank" rel="noopener noreferrer"
                  className="text-[#393939] text-sm font-medium hover:text-black hover:underline transition-colors inline-flex items-center gap-1">
                  Solana <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider mb-4">Legal</h4>
            <ul className="space-y-2">
              <li><Link href="/terms" className="text-[#393939] text-sm font-medium hover:text-black hover:underline transition-colors">Términos</Link></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className="border-t-3 border-black">
        <div className="container mx-auto px-4 py-4 max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[#393939] text-xs font-bold">
            &copy; {new Date().getFullYear()} Wira &middot; Powered by Solana
          </p>
          <div className="flex items-center gap-3">
            <a href="https://github.com/gabrhnz/wira" target="_blank" rel="noopener noreferrer"
              className="w-8 h-8 bg-black rounded-lg border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all">
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white" aria-hidden="true">
                <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
            </a>
            <a href="https://x.com/gabrhnz" target="_blank" rel="noopener noreferrer"
              className="w-8 h-8 bg-black rounded-lg border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all">
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-white" aria-hidden="true">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
