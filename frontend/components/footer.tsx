import Link from "next/link";
import { ExternalLink } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-black text-white">
      {/* CTA Banner */}
      <div className="border-b border-gray-800">
        <div className="container mx-auto px-4 py-12 md:py-16 max-w-5xl">
          <div className="bg-gradient-to-br from-[#9945FF] to-[#14F195] rounded-2xl border-4 border-white/20 p-8 md:p-12 text-center">
            <h3 className="text-2xl md:text-3xl font-bold mb-3">
              Empieza a cobrar en USDC hoy
            </h3>
            <p className="text-white/80 text-sm md:text-base mb-6 max-w-md mx-auto">
              Publica tu primer servicio en menos de 2 minutos. Sin comisiones. Sin bancos.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/register"
                className="bg-white text-black border-2 border-white rounded-xl px-8 py-3 font-bold text-sm hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] transition-all"
              >
                Crear Cuenta
              </Link>
              <Link
                href="/marketplace"
                className="bg-transparent text-white border-2 border-white/40 rounded-xl px-8 py-3 font-bold text-sm hover:bg-white/10 transition-all"
              >
                Explorar Marketplace
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Links Grid */}
      <div className="container mx-auto px-4 py-10 max-w-5xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-full bg-[#9945FF] flex items-center justify-center">
                <span className="text-white text-xs font-bold">W</span>
              </div>
              <span className="text-lg font-bold">Wira</span>
            </div>
            <p className="text-gray-400 text-xs leading-relaxed mb-4">
              Marketplace freelance descentralizado en Solana. Pagos instantáneos con USDC.
            </p>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 bg-[#14F195]/10 text-[#14F195] border border-[#14F195]/20 rounded-full px-2.5 py-1 text-[10px] font-bold">
                <span className="w-1.5 h-1.5 bg-[#14F195] rounded-full animate-pulse" />
                Devnet
              </span>
            </div>
          </div>

          {/* Platform */}
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-gray-500 mb-4">Plataforma</h4>
            <ul className="space-y-2.5">
              <li><Link href="/marketplace" className="text-gray-400 text-sm hover:text-white transition-colors">Marketplace</Link></li>
              <li><Link href="/register" className="text-gray-400 text-sm hover:text-white transition-colors">Registro</Link></li>
              <li><Link href="/dashboard" className="text-gray-400 text-sm hover:text-white transition-colors">Dashboard</Link></li>
              <li><Link href="/services/new" className="text-gray-400 text-sm hover:text-white transition-colors">Publicar Servicio</Link></li>
            </ul>
          </div>

          {/* Solana */}
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-gray-500 mb-4">Solana</h4>
            <ul className="space-y-2.5">
              <li>
                <a href="https://explorer.solana.com/address/6zjwrFhvtcub6FYvb3kZCGTXLT3pzH2fQmyjFhM5WQSb?cluster=devnet" target="_blank" rel="noopener noreferrer"
                  className="text-gray-400 text-sm hover:text-white transition-colors inline-flex items-center gap-1">
                  Programa <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a href="https://phantom.app" target="_blank" rel="noopener noreferrer"
                  className="text-gray-400 text-sm hover:text-white transition-colors inline-flex items-center gap-1">
                  Phantom Wallet <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a href="https://solana.com" target="_blank" rel="noopener noreferrer"
                  className="text-gray-400 text-sm hover:text-white transition-colors inline-flex items-center gap-1">
                  Solana.com <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-gray-500 mb-4">Legal</h4>
            <ul className="space-y-2.5">
              <li><Link href="/terms" className="text-gray-400 text-sm hover:text-white transition-colors">Términos</Link></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-gray-800">
        <div className="container mx-auto px-4 py-5 max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-gray-500 text-xs">
            &copy; {new Date().getFullYear()} Wira. Powered by Solana.
          </p>
          <div className="flex items-center gap-4">
            <a href="https://github.com" target="_blank" rel="noopener noreferrer"
              className="text-gray-500 hover:text-white transition-colors">
              <svg viewBox="0 0 24 24" className="w-4.5 h-4.5 fill-current" aria-hidden="true">
                <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
            </a>
            <a href="https://x.com" target="_blank" rel="noopener noreferrer"
              className="text-gray-500 hover:text-white transition-colors">
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden="true">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
