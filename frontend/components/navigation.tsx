"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Menu, X, Search, LayoutDashboard, LogOut, MessageSquare, Package, Moon, Sun, Globe, Languages } from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useLanguage } from "@/contexts/language-context";
import { useSession } from "@/contexts/session-context";
import { useTheme } from "@/contexts/theme-context";
import { useState, useEffect, useRef, useCallback } from "react";
import { shortWallet } from "@/lib/utils";
import { getUnreadDMCount, getProfileByEmail, getProfileByWallet } from "@/lib/supabase";

export function Navigation() {
  const { publicKey, connected, disconnect } = useWallet();
  const { user, logout } = useSession();
  const { t, language, setLanguage } = useLanguage();
  const { isDark, toggleTheme } = useTheme();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const isLoggedIn = !!user || connected;
  const [unreadCount, setUnreadCount] = useState(0);
  const prevConnected = useRef(connected);
  const searchRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Fetch unread message count
  const fetchUnread = useCallback(async () => {
    let profileId: string | null = null;
    if (user?.email) {
      const p = await getProfileByEmail(user.email);
      if (p) profileId = p.id;
    }
    if (!profileId && publicKey) {
      const p = await getProfileByWallet(publicKey.toBase58());
      if (p) profileId = p.id;
    }
    if (profileId) {
      const count = await getUnreadDMCount(profileId);
      setUnreadCount(count);
    }
  }, [user?.email, publicKey]);

  useEffect(() => {
    if (isLoggedIn) {
      fetchUnread();
      const interval = setInterval(fetchUnread, 15000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn, fetchUnread]);

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
      <nav className="flex items-center justify-between bg-white border-4 border-black rounded-xl px-5 py-3 max-w-5xl mx-auto shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-colors">
        {/* Logo */}
        <Link
          href={isLoggedIn ? "/marketplace" : "/"}
          className="flex items-center gap-2 flex-shrink-0"
        >
          <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center">
            <div className="w-6 h-6 bg-white rounded-full"></div>
          </div>
          <span className="text-[20px] font-bold">Wira</span>
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
                  placeholder={t.navLoggedIn.searchPlaceholder}
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
                <span className="text-[12px] font-bold">{t.navLoggedIn.panel}</span>
              </Link>
              <Link
                href="/inbox"
                className="relative flex items-center gap-1.5 px-3 py-2 rounded-lg border-2 border-black hover:bg-[#F5F5F5] transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                <span className="text-[12px] font-bold">{t.navLoggedIn.messages}</span>
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-ve-red text-white text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center border-2 border-white">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Link>
              <Link
                href="/orders"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border-2 border-black hover:bg-[#F5F5F5] transition-colors"
              >
                <Package className="w-4 h-4" />
                <span className="text-[12px] font-bold">{t.navLoggedIn.orders}</span>
              </Link>
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
                      <span className="text-sm font-bold">{t.profile.editProfile}</span>
                    </Link>
                    {publicKey && (
                      <div className="px-4 py-3 border-b-2 border-black/10">
                        <p className="text-[10px] font-bold text-[#393939] mb-1">{t.profile.walletConnected}</p>
                        <p className="text-xs font-bold font-mono text-[#9945FF]">{shortWallet(publicKey.toBase58())}</p>
                      </div>
                    )}
                    {/* Language */}
                    <div className="px-4 py-3 border-b-2 border-black/10 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Languages className="w-4 h-4 text-[#393939]" />
                        <span className="text-sm font-bold">{t.profile.language}</span>
                      </div>
                      <div className="flex bg-[#F5F5F5] rounded-lg border-2 border-black/10 overflow-hidden">
                        <button
                          onClick={() => setLanguage("es")}
                          className={`px-2.5 py-1 text-[11px] font-bold transition-colors ${language === "es" ? "bg-black text-white" : "text-[#393939] hover:text-black"}`}
                        >
                          ES
                        </button>
                        <button
                          onClick={() => setLanguage("en")}
                          className={`px-2.5 py-1 text-[11px] font-bold transition-colors ${language === "en" ? "bg-black text-white" : "text-[#393939] hover:text-black"}`}
                        >
                          EN
                        </button>
                      </div>
                    </div>
                    {/* Dark mode */}
                    <button
                      onClick={toggleTheme}
                      className="flex items-center justify-between px-4 py-3 hover:bg-[#F5F5F5] transition-colors w-full text-left border-b-2 border-black/10"
                    >
                      <div className="flex items-center gap-2.5">
                        {isDark ? <Sun className="w-4 h-4 text-yellow-500" /> : <Moon className="w-4 h-4 text-[#393939]" />}
                        <span className="text-sm font-bold">{isDark ? t.profile.lightMode : t.profile.darkMode}</span>
                      </div>
                      <div className={`w-8 h-4.5 rounded-full relative transition-colors ${isDark ? "bg-[#9945FF]" : "bg-[#ccc]"}`}>
                        <div className={`absolute top-0.5 w-3.5 h-3.5 bg-white rounded-full shadow transition-all ${isDark ? "left-[18px]" : "left-0.5"}`} />
                      </div>
                    </button>
                    <button
                      onClick={() => { setProfileMenuOpen(false); handleLogout(); }}
                      className="flex items-center gap-2.5 px-4 py-3 hover:bg-red-50 transition-colors text-red-600 w-full text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="text-sm font-bold">{t.profile.logout}</span>
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
              <button
                onClick={() => setLanguage(language === "en" ? "es" : "en")}
                className="flex items-center gap-1 px-2.5 py-2 rounded-lg border-2 border-black hover:bg-[#F5F5F5] transition-colors text-[12px] font-bold"
                title={language === "en" ? "Cambiar a Español" : "Switch to English"}
              >
                <Globe className="w-3.5 h-3.5" />
                {language === "en" ? "EN" : "ES"}
              </button>
              <button
                onClick={toggleTheme}
                className="w-9 h-9 flex items-center justify-center rounded-lg border-2 border-black hover:bg-[#F5F5F5] transition-colors"
                title={isDark ? "Modo día" : "Modo nocturno"}
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              <Link
                href="/register"
                className="bg-white text-black border-2 border-black rounded-lg px-4 py-2 text-[14px] font-bold hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all"
              >
                {t.navLoggedIn.signIn}
              </Link>
              <Link
                href="/register"
                className="bg-[#9945FF] text-white border-2 border-black rounded-lg px-4 py-2 text-[14px] font-bold hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all animate-pulse-subtle"
              >
                {t.navLoggedIn.joinFree}
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
        <div className="md:hidden mt-4 bg-white border-4 border-black rounded-xl p-5 max-w-5xl mx-auto shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-colors">
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
                    placeholder={t.navLoggedIn.searchPlaceholder}
                    className="w-full pl-10 pr-4 py-3 border-2 border-black rounded-lg text-[16px] font-medium focus:outline-none focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-shadow"
                  />
                </form>
                <Link href="/marketplace" onClick={() => setMobileMenuOpen(false)} className="text-[18px] font-bold hover:opacity-70 transition-opacity">
                  {t.navLoggedIn.marketplace}
                </Link>
                <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)} className="text-[18px] font-bold hover:opacity-70 transition-opacity">
                  {t.navLoggedIn.panel}
                </Link>
                <Link href="/inbox" onClick={() => setMobileMenuOpen(false)} className="relative inline-flex items-center gap-2 text-[18px] font-bold hover:opacity-70 transition-opacity">
                  {t.navLoggedIn.messages}
                  {unreadCount > 0 && (
                    <span className="bg-ve-red text-white text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </Link>
                <Link href="/orders" onClick={() => setMobileMenuOpen(false)} className="text-[18px] font-bold hover:opacity-70 transition-opacity">
                  {t.navLoggedIn.orders}
                </Link>
                <Link href="/profile/edit" onClick={() => setMobileMenuOpen(false)} className="text-[18px] font-bold hover:opacity-70 transition-opacity">
                  {t.profile.myProfile}
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-[18px] font-bold text-red-600 hover:opacity-70 transition-opacity text-left"
                >
                  <LogOut className="w-5 h-5" />
                  {t.profile.logout}
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
              {/* Language toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[18px] font-bold">
                  <Languages className="w-5 h-5" />
                  {t.profile.language}
                </div>
                <div className="flex bg-[#F5F5F5] rounded-lg border-2 border-black/10 overflow-hidden">
                  <button
                    onClick={() => setLanguage("es")}
                    className={`px-3 py-1.5 text-[13px] font-bold transition-colors ${language === "es" ? "bg-black text-white" : "text-[#393939]"}`}
                  >
                    ES
                  </button>
                  <button
                    onClick={() => setLanguage("en")}
                    className={`px-3 py-1.5 text-[13px] font-bold transition-colors ${language === "en" ? "bg-black text-white" : "text-[#393939]"}`}
                  >
                    EN
                  </button>
                </div>
              </div>
              {/* Dark mode toggle */}
              <button
                onClick={toggleTheme}
                className="flex items-center justify-between text-[18px] font-bold hover:opacity-70 transition-opacity text-left"
              >
                <div className="flex items-center gap-2">
                  {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                  {isDark ? t.profile.lightMode : t.profile.darkMode}
                </div>
                <div className={`w-10 h-5 rounded-full relative transition-colors ${isDark ? "bg-[#9945FF]" : "bg-[#ccc]"}`}>
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${isDark ? "left-[22px]" : "left-0.5"}`} />
                </div>
              </button>
              {!isLoggedIn && (
                <>
                  <Link
                    href="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="bg-white text-black border-2 border-black rounded-lg px-4 py-3 text-[16px] font-bold text-center hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all"
                  >
                    {t.navLoggedIn.signIn}
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="bg-[#9945FF] text-white border-2 border-black rounded-lg px-4 py-3 text-[16px] font-bold text-center hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all"
                  >
                    {t.navLoggedIn.joinFree}
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
