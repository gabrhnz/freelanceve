"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Navigation } from "@/components/navigation";
import { CATEGORIES } from "@/lib/constants";
import { getServices, Service } from "@/lib/supabase";
import { Search, SlidersHorizontal, Briefcase, Clock, X, Sparkles } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import toast from "react-hot-toast";

export default function MarketplacePage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoria, setCategoria] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [aiSearch, setAiSearch] = useState(false);
  const [aiSearching, setAiSearching] = useState(false);
  const { t } = useLanguage();

  const fetchServices = useCallback(async () => {
    setLoading(true);
    const data = await getServices({
      categoria: categoria !== "all" ? categoria : undefined,
      search: !aiSearch ? (search.trim() || undefined) : undefined,
    });

    // If AI search is on and there's a query, rank results with AI
    if (aiSearch && search.trim() && data.length > 0) {
      setAiSearching(true);
      try {
        const res = await fetch("/api/ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "search",
            query: search.trim(),
            services: data.map(s => ({ id: s.id, titulo: s.titulo, descripcion: s.descripcion, categoria: s.categoria, precio_usdc: s.precio_usdc })),
          }),
        });
        if (res.ok) {
          const { rankedIds } = await res.json();
          if (rankedIds?.length > 0) {
            const idOrder = new Map(rankedIds.map((id: string, i: number) => [id, i]));
            const ranked = [...data].sort((a, b) => {
              const ai = idOrder.get(a.id) ?? 999;
              const bi = idOrder.get(b.id) ?? 999;
              return (ai as number) - (bi as number);
            });
            setServices(ranked);
            setLoading(false);
            setAiSearching(false);
            return;
          }
        }
      } catch {
        // Fallback to normal results
      }
      setAiSearching(false);
    }

    setServices(data);
    setLoading(false);
  }, [categoria, search, aiSearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchServices();
    }, 500);
    return () => clearTimeout(timer);
  }, [fetchServices]);

  return (
    <>
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-[36px] md:text-[48px] font-bold leading-tight">
            {t.marketplace.title} <span className="bg-ve-yellow px-2">{t.marketplace.titleHighlight}</span>
          </h1>
          <p className="text-[#393939] text-[16px] font-medium mt-2 max-w-lg">
            {t.marketplace.subtitle}
          </p>
        </div>

        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#393939]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={aiSearch ? t.marketplace.searchPlaceholderAi : t.marketplace.searchPlaceholder}
              className={`w-full border-4 rounded-xl pl-12 pr-20 py-3 text-[16px] font-medium placeholder:text-gray-400 focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow ${
                aiSearch ? "border-[#9945FF] bg-purple-50/30" : "border-black"
              }`}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {search && (
                <button onClick={() => setSearch("")} className="p-1">
                  <X className="w-4 h-4 text-[#393939]" />
                </button>
              )}
              <button
                onClick={() => { setAiSearch(!aiSearch); if (!aiSearch) toast("Smart search ON", { icon: "✨" }); }}
                className={`p-1.5 rounded-lg transition-all ${
                  aiSearch ? "bg-[#9945FF] text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" : "text-[#393939] hover:text-[#9945FF]"
                }`}
                title="AI Search"
              >
                <Sparkles className="w-4 h-4" />
              </button>
            </div>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-2 border-4 border-black rounded-xl px-5 py-3 font-bold shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] transition-all ${
              showFilters ? "bg-black text-white" : "bg-white text-black"
            }`}
          >
            <SlidersHorizontal className="w-5 h-5" />
            {t.marketplace.filters}
          </button>
        </div>

        {/* Category Filter Pills */}
        {showFilters && (
          <div className="flex flex-wrap gap-2 mb-6 p-4 bg-[#F5F5F5] border-4 border-black/10 rounded-xl">
            <button
              onClick={() => setCategoria("all")}
              className={`rounded-lg px-4 py-2 text-sm font-bold border-2 border-black transition-all ${
                categoria === "all"
                  ? "bg-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  : "bg-white text-black hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              }`}
            >
              {t.marketplace.all}
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoria(cat)}
                className={`rounded-lg px-4 py-2 text-sm font-bold border-2 border-black transition-all ${
                  categoria === cat
                    ? "bg-ve-blue text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    : "bg-white text-black hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Results count */}
        {!loading && (
          <p className="text-sm font-bold text-[#393939] mb-4">
            {services.length} {services.length !== 1 ? t.marketplace.servicesFound : t.marketplace.serviceFound}
            {aiSearch && search.trim() && <span className="ml-2 text-[#9945FF]">✨ {t.marketplace.aiSorted}</span>}
            {aiSearching && <span className="ml-2 text-[#9945FF] animate-pulse">⏳ {t.marketplace.aiAnalyzing}</span>}
          </p>
        )}

        {/* Grid */}
        {loading ? (
          <div className="flex min-h-[40vh] items-center justify-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-black border-t-transparent" />
          </div>
        ) : services.length === 0 ? (
          <div className="bg-[#F5F5F5] border-4 border-black/10 rounded-xl p-12 text-center">
            <Briefcase className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-xl font-bold mb-2">{t.marketplace.noServices}</p>
            <p className="text-[#393939] font-medium">
              {search || categoria !== "all"
                ? t.marketplace.noServicesHint
                : t.marketplace.noServicesEmpty}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <Link key={service.id} href={`/marketplace/${service.id}`}>
                <div className="group bg-white border-4 border-black rounded-xl p-5 transition-all hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] h-full flex flex-col">
                  {/* Category + Status */}
                  <div className="mb-3 flex items-center justify-between">
                    <span className="bg-ve-blue text-white border-2 border-black rounded-lg px-2.5 py-0.5 text-xs font-bold">
                      {service.categoria}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="mb-1 text-lg font-bold group-hover:underline">
                    {service.titulo}
                  </h3>

                  {/* Description */}
                  {service.descripcion && (
                    <p className="mb-3 line-clamp-2 text-sm text-[#393939] font-medium flex-1">
                      {service.descripcion}
                    </p>
                  )}

                  {/* Owner */}
                  {service.owner && (
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 bg-[#9945FF] rounded-full border-2 border-black flex items-center justify-center">
                        <span className="text-white text-[10px] font-bold">
                          {service.owner.nombre?.charAt(0).toUpperCase() || "?"}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-[#393939]">{service.owner.nombre}</span>
                    </div>
                  )}

                  {/* Price + Delivery */}
                  <div className="flex items-center justify-between border-t-3 border-black/10 pt-3 mt-auto">
                    <span className="text-sm font-bold text-[#2775CA]">
                      ${service.precio_usdc} USDC
                    </span>
                    <span className="text-xs font-bold text-[#393939] flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {service.delivery_days} {t.marketplace.days}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
