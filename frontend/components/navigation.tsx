"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Menu, X, Search, LayoutDashboard, LogOut, MessageSquare, Package } from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useLanguage } from "@/contexts/language-context";
import { useSession } from "@/contexts/session-context";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useState, useEffect, useRef } from "react";
import { shortWallet } from "@/lib/utils";

export function Navigation() {
  const { publicKey, connected, disconnect } = useWallet();
  const { user, logout } = useSession();
  const { t } = useLanguage();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const isLoggedIn = !!user || connected;
  const prevConnected = useRef(connected);
  const searchRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Auto-logout when wallet disconnects
  useEffect(() => {
    if (prevConnected.current && !connected) {
      // Wallet was just disconnected — clear email session too
      logout();
      router.push("/");
    }
    prevConnected.current = connected;
  }, [connected, logout, router]);

  const handleLogout = async () => {
    await logout();
    try { await disconnect(); } catch {}
    setMobileMenuOpen(false);
    router.push("/");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/marketplace?q=${encodeURIComponent(searchQuery.trim())}`);
      setMobileMenuOpen(false);
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (s: string) => {
    setSearchQuery(s);
    setShowSuggestions(false);
    router.push(`/marketplace?q=${encodeURIComponent(s)}`);
    setMobileMenuOpen(false);
  };

  // Close suggestions + profile menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node) &&
          mobileSearchRef.current && !mobileSearchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const SUGGESTIONS = [
    // Instagram
    "Editor de videos Instagram", "Instagram posts", "Instagram reels", "Instagram stories",
    "Gestión de Instagram", "Diseño para Instagram",
    // X / Twitter
    "Gestión de X (Twitter)", "Diseño para X", "Contenido para X", "Threads para X",
    // YouTube
    "Editor de videos YouTube", "Thumbnails YouTube", "YouTube Shorts",
    "Guiones para YouTube", "SEO para YouTube", "Gestión canal YouTube",
    // TikTok
    "Editor de videos TikTok", "Contenido TikTok", "Gestión TikTok",
    // Web Development
    "Desarrollo web", "Landing page", "Tienda online", "E-commerce",
    "WordPress", "React developer", "Next.js developer", "Frontend developer",
    "Backend developer", "Full stack developer", "API development",
    // Design
    "Diseño gráfico", "Diseño de logo", "Branding", "UI/UX Design",
    "Diseño de flyers", "Diseño de banners", "Mockups",
    // Marketing
    "Community manager", "Social media manager", "Marketing digital",
    "Google Ads", "Facebook Ads", "Email marketing", "SEO",
    // Blockchain
    "Smart contracts", "Solana developer", "NFT artist", "Web3 developer",
    "DeFi developer", "Tokenomics",
    // Writing
    "Redacción de contenido", "Copywriting", "Traducción", "Blog posts",
    // Other
    "Asistente virtual", "Data entry", "Edición de fotos", "Animación",
    "Voiceover", "Música", "Podcast editing",
  ];

  const filtered = searchQuery.trim().length >= 2
    ? SUGGESTIONS.filter((s) => s.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 8)
    : [];

  return (
    <div className="container mx-auto px-4 pt-8 pb-4">
      <nav className="flex items-center justify-between bg-white border-4 border-black rounded-xl px-5 py-3 max-w-5xl mx-auto shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        {/* Logo */}
        <Link
          href={isLoggedIn ? "/marketplace" : "/"}
          className="flex items-center gap-2 flex-shrink-0"
        >
          <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center">
            <div className="w-6 h-6 bg-white rounded-full"></div>
          </div>
          <span className="text-[20px] font-bold hidden sm:inline">Wira</span>
        </Link>

        {isLoggedIn ? (
          <>
            {/* Logged-in: search bar + icons */}
            <form onSubmit={handleSearch} className="hidden md:flex items-center flex-1 max-w-md mx-6">
              <div className="relative w-full" ref={searchRef}>
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#393939]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setShowSuggestions(true); }}
                  onFocus={() => setShowSuggestions(true)}
                  placeholder="Buscar servicios..."
                  className="w-full pl-10 pr-4 py-2 border-2 border-black rounded-lg text-[14px] font-medium focus:outline-none focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-shadow"
                />
                {showSuggestions && filtered.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border-3 border-black rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-50 overflow-hidden">
                    {filtered.map((s, i) => (
                      <button key={i} onClick={() => selectSuggestion(s)} type="button"
                        className="w-full text-left px-4 py-2.5 text-sm font-medium hover:bg-[#F5F5F5] flex items-center gap-2 transition-colors border-b border-black/5 last:border-0">
                        <Search className="w-3 h-3 text-[#393939] flex-shrink-0" />
                        <span dangerouslySetInnerHTML={{ __html: s.replace(new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'), '<strong class="text-[#9945FF]">$1</strong>') }} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </form>

            <div className="hidden md:flex items-center gap-1.5 flex-shrink-0">
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border-2 border-black hover:bg-[#F5F5F5] transition-colors"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span className="text-[12px] font-bold">Panel</span>
              </Link>
              <Link
                href="/inbox"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border-2 border-black hover:bg-[#F5F5F5] transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                <span className="text-[12px] font-bold">Mensajes</span>
              </Link>
              <Link
                href="/orders"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border-2 border-black hover:bg-[#F5F5F5] transition-colors"
              >
                <Package className="w-4 h-4" />
                <span className="text-[12px] font-bold">Órdenes</span>
              </Link>
              <LanguageSwitcher />

              {/* Profile dropdown */}
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-[#F5F5F5] rounded-lg border-2 border-black hover:bg-[#EBEBEB] transition-colors"
                >
                  <div className="w-6 h-6 bg-[#9945FF] rounded-full flex items-center justify-center">
                    <User className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-[12px] font-bold max-w-[80px] truncate">
                    {user?.nombre || (publicKey ? shortWallet(publicKey.toBase58()) : "Perfil")}
                  </span>
                  <svg className={`w-3 h-3 transition-transform ${profileMenuOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                </button>

                {profileMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white border-3 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-50 overflow-hidden">
                    <Link
                      href="/profile/edit"
                      onClick={() => setProfileMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-3 hover:bg-[#F5F5F5] transition-colors border-b-2 border-black/10"
                    >
                      <User className="w-4 h-4 text-[#9945FF]" />
                      <span className="text-sm font-bold">Editar perfil</span>
                    </Link>
                    {publicKey && (
                      <div className="px-4 py-3 border-b-2 border-black/10">
                        <p className="text-[10px] font-bold text-[#393939] mb-1">Wallet conectada</p>
                        <p className="text-xs font-bold font-mono text-[#9945FF]">{shortWallet(publicKey.toBase58())}</p>
                      </div>
                    )}
                    <button
                      onClick={() => { setProfileMenuOpen(false); handleLogout(); }}
                      className="flex items-center gap-2.5 px-4 py-3 hover:bg-red-50 transition-colors text-red-600 w-full text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="text-sm font-bold">Cerrar sesión</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Logged-out: landing nav */}
            <div className="hidden md:flex items-center gap-6 flex-1 justify-center">
              <Link href="/" className="text-[18px] font-bold leading-[20px] hover:opacity-70 transition-opacity">
                {t.nav.home}
              </Link>
              <Link href="#services" className="text-[18px] font-bold leading-[20px] hover:opacity-70 transition-opacity">
                {t.nav.services}
              </Link>
              <Link href="#about" className="text-[18px] font-bold leading-[20px] hover:opacity-70 transition-opacity">
                {t.nav.about}
              </Link>
            </div>

            <div className="hidden md:flex items-center gap-3 flex-shrink-0">
              <LanguageSwitcher />
              <Link
                href="/register"
                className="bg-white text-black border-2 border-black rounded-lg px-4 py-2 text-[14px] font-bold hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all"
              >
                Iniciar sesión
              </Link>
              <Link
                href="/register"
                className="bg-[#9945FF] text-white border-2 border-black rounded-lg px-4 py-2 text-[14px] font-bold hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all animate-pulse-subtle"
              >
                Únete gratis
              </Link>
              <WalletMultiButton style={navButtonStyle} />
            </div>
          </>
        )}

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden w-10 h-10 flex items-center justify-center"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-4 bg-white border-4 border-black rounded-xl p-5 max-w-5xl mx-auto shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex flex-col gap-4">
            {isLoggedIn ? (
              <>
                {/* Mobile search */}
                <form onSubmit={handleSearch} className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#393939]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar servicios..."
                    className="w-full pl-10 pr-4 py-3 border-2 border-black rounded-lg text-[16px] font-medium focus:outline-none focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-shadow"
                  />
                </form>
                <Link href="/marketplace" onClick={() => setMobileMenuOpen(false)} className="text-[18px] font-bold hover:opacity-70 transition-opacity">
                  Marketplace
                </Link>
                <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)} className="text-[18px] font-bold hover:opacity-70 transition-opacity">
                  Dashboard
                </Link>
                <Link href="/inbox" onClick={() => setMobileMenuOpen(false)} className="text-[18px] font-bold hover:opacity-70 transition-opacity">
                  Inbox
                </Link>
                <Link href="/orders" onClick={() => setMobileMenuOpen(false)} className="text-[18px] font-bold hover:opacity-70 transition-opacity">
                  Órdenes
                </Link>
                <Link href="/profile/edit" onClick={() => setMobileMenuOpen(false)} className="text-[18px] font-bold hover:opacity-70 transition-opacity">
                  Mi Perfil
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-[18px] font-bold text-red-600 hover:opacity-70 transition-opacity text-left"
                >
                  <LogOut className="w-5 h-5" />
                  Cerrar sesión
                </button>
              </>
            ) : (
              <>
                <Link href="/" onClick={() => setMobileMenuOpen(false)} className="text-[18px] font-bold hover:opacity-70 transition-opacity">
                  {t.nav.home}
                </Link>
                <Link href="#services" onClick={() => setMobileMenuOpen(false)} className="text-[18px] font-bold hover:opacity-70 transition-opacity">
                  {t.nav.services}
                </Link>
                <Link href="#about" onClick={() => setMobileMenuOpen(false)} className="text-[18px] font-bold hover:opacity-70 transition-opacity">
                  {t.nav.about}
                </Link>
              </>
            )}

            <div className="border-t-2 border-black/10 pt-4 mt-2 flex flex-col gap-3">
              {!isLoggedIn && (
                <>
                  <Link
                    href="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="bg-white text-black border-2 border-black rounded-lg px-4 py-3 text-[16px] font-bold text-center hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all"
                  >
                    Iniciar sesión
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="bg-[#9945FF] text-white border-2 border-black rounded-lg px-4 py-3 text-[16px] font-bold text-center hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all"
                  >
                    Únete gratis
                  </Link>
                </>
              )}
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
