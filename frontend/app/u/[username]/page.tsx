"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Navigation } from "@/components/navigation";
import {
  Profile, Service,
  getProfileByUsername, getProfileById,
  getServicesByOwner, getReviewsByFreelancer, Review,
} from "@/lib/supabase";
import {
  User, Star, Clock, ExternalLink, MessageSquare,
  AtSign, Globe, FileText,
  ChevronLeft, ChevronRight,
} from "lucide-react";

export default function PublicProfilePage() {
  const params = useParams();
  const identifier = params.username as string;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [portfolioIdx, setPortfolioIdx] = useState(0);

  useEffect(() => {
    async function load() {
      let p = await getProfileByUsername(identifier);
      if (!p) p = await getProfileById(identifier);
      if (p) {
        setProfile(p);
        const [srvs, revs] = await Promise.all([
          getServicesByOwner(p.id),
          getReviewsByFreelancer(p.id),
        ]);
        setServices(srvs.filter((s) => s.activo));
        setReviews(revs);
      }
      setLoading(false);
    }
    load();
  }, [identifier]);

  if (loading) {
    return (<><Navigation /><div className="flex min-h-[60vh] items-center justify-center"><div className="h-12 w-12 animate-spin rounded-full border-4 border-black border-t-transparent" /></div></>);
  }
  if (!profile) {
    return (<><Navigation /><div className="flex min-h-[60vh] items-center justify-center"><div className="bg-white border-4 border-black rounded-xl p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-center"><p className="text-xl font-bold mb-2">Perfil no encontrado</p><Link href="/" className="text-[#9945FF] font-bold hover:underline">Volver al inicio</Link></div></div></>);
  }

  const avgRating = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const portfolio = profile.portfolio || [];
  const social = profile.social_links || {};

  return (
    <>
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">

        {/* Header card */}
        <div className="bg-white border-4 border-black rounded-xl p-6 md:p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="w-24 h-24 rounded-full border-4 border-black overflow-hidden bg-[#F5F5F5] flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex-shrink-0">
              {profile.avatar_url ? <img src={profile.avatar_url} alt={profile.nombre} className="w-full h-full object-cover" /> : <User className="w-10 h-10 text-[#393939]" />}
            </div>
            <div className="text-center sm:text-left flex-1">
              <h1 className="text-[28px] md:text-[36px] font-bold leading-tight">{profile.nombre}</h1>
              {profile.username && <p className="text-[#9945FF] font-bold">@{profile.username}</p>}
              {profile.bio && <p className="text-[#393939] mt-2 font-medium">{profile.bio}</p>}

              {/* Rating */}
              {reviews.length > 0 && (
                <div className="flex items-center gap-2 mt-3 justify-center sm:justify-start">
                  <div className="flex">
                    {[1,2,3,4,5].map((n) => (
                      <Star key={n} className={`w-4 h-4 ${n <= Math.round(avgRating) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`} />
                    ))}
                  </div>
                  <span className="text-sm font-bold">{avgRating.toFixed(1)}</span>
                  <span className="text-xs text-[#393939]">({reviews.length} reseñas)</span>
                </div>
              )}

              <div className="flex flex-wrap gap-2 mt-3 justify-center sm:justify-start">
                <span className="bg-ve-blue text-white border-2 border-black rounded-lg px-3 py-1 text-xs font-bold">{profile.role}</span>
                {profile.categoria && <span className="bg-ve-yellow border-2 border-black rounded-lg px-3 py-1 text-xs font-bold">{profile.categoria}</span>}
              </div>
              {profile.skills && profile.skills.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3 justify-center sm:justify-start">
                  {profile.skills.map((s) => <span key={s} className="bg-[#F5F5F5] border-2 border-black rounded-lg px-2 py-0.5 text-xs font-bold">{s}</span>)}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <Link href={`/chat/${profile.id}`}
                className="flex items-center gap-2 bg-[#9945FF] text-white border-3 border-black rounded-xl px-5 py-3 font-bold text-sm shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] transition-all">
                <MessageSquare className="w-4 h-4" /> Contactar
              </Link>
            </div>
          </div>

          {/* Social links */}
          {(social.twitter || social.instagram || social.website) && (
            <div className="flex gap-3 mt-5 pt-5 border-t-2 border-black/10 flex-wrap">
              {social.twitter && (
                <a href={social.twitter.startsWith("http") ? social.twitter : `https://x.com/${social.twitter.replace("@","")}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg border-2 border-black text-xs font-bold hover:opacity-80 transition-opacity">
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  Twitter / X
                </a>
              )}
              {social.instagram && (
                <a href={social.instagram.startsWith("http") ? social.instagram : `https://instagram.com/${social.instagram.replace("@","")}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-pink-500 text-white rounded-lg border-2 border-black text-xs font-bold hover:opacity-80 transition-opacity">
                  <AtSign className="w-3.5 h-3.5" /> Instagram
                </a>
              )}
              {social.website && (
                <a href={social.website.startsWith("http") ? social.website : `https://${social.website}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-black rounded-lg text-xs font-bold hover:bg-[#F5F5F5] transition-colors">
                  <Globe className="w-3.5 h-3.5" /> Sitio web
                </a>
              )}
            </div>
          )}
        </div>

        {/* Portfolio */}
        {portfolio.length > 0 && (
          <div className="bg-white border-4 border-black rounded-xl p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <h2 className="text-xl font-bold mb-4">Portafolio</h2>
            <div className="relative group">
              <div className="rounded-xl overflow-hidden border-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] bg-[#F5F5F5]">
                {portfolio[portfolioIdx]?.file_type?.startsWith("image/") ? (
                  <a href={portfolio[portfolioIdx].file_url || portfolio[portfolioIdx].url} target="_blank" rel="noopener noreferrer">
                    <img src={portfolio[portfolioIdx].file_url || portfolio[portfolioIdx].url} alt={portfolio[portfolioIdx].title}
                      className="w-full max-h-80 object-contain" />
                  </a>
                ) : (
                  <a href={portfolio[portfolioIdx].file_url || portfolio[portfolioIdx].url} target="_blank" rel="noopener noreferrer"
                    className="flex flex-col items-center justify-center h-40 gap-2 hover:bg-[#EBEBEB] transition-colors">
                    <FileText className="w-10 h-10 text-[#393939]" />
                    <span className="text-sm font-bold text-[#393939]">{portfolio[portfolioIdx].title}</span>
                    <span className="text-xs text-[#9945FF] font-bold flex items-center gap-1"><ExternalLink className="w-3 h-3" /> Ver archivo</span>
                  </a>
                )}
              </div>
              {portfolio.length > 1 && (
                <>
                  <button onClick={() => setPortfolioIdx((i) => (i - 1 + portfolio.length) % portfolio.length)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 border-2 border-black rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button onClick={() => setPortfolioIdx((i) => (i + 1) % portfolio.length)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 border-2 border-black rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <div className="flex justify-center gap-2 mt-3">
                    {portfolio.map((_, i) => (
                      <button key={i} onClick={() => setPortfolioIdx(i)}
                        className={`w-2 h-2 rounded-full border border-black transition-all ${i === portfolioIdx ? "bg-[#9945FF] scale-125" : "bg-gray-300"}`} />
                    ))}
                  </div>
                </>
              )}
              <p className="text-xs font-bold text-center text-[#393939] mt-2">{portfolio[portfolioIdx].title}</p>
            </div>
            {portfolio.length > 1 && (
              <div className="flex gap-2 mt-3 overflow-x-auto">
                {portfolio.map((item, i) => (
                  <button key={i} onClick={() => setPortfolioIdx(i)}
                    className={`w-14 h-14 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${i === portfolioIdx ? "border-[#9945FF] shadow-[2px_2px_0px_0px_rgba(153,69,255,1)]" : "border-black/30"}`}>
                    {item.file_type?.startsWith("image/")
                      ? <img src={item.file_url || item.url} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full bg-[#F5F5F5] flex items-center justify-center"><FileText className="w-5 h-5 text-[#393939]" /></div>}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Reviews */}
        {reviews.length > 0 && (
          <div className="bg-white border-4 border-black rounded-xl p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" /> Reseñas ({reviews.length})
            </h2>
            <div className="space-y-3">
              {reviews.map((r) => (
                <div key={r.id} className="border-2 border-black/10 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex">
                      {[1,2,3,4,5].map((n) => <Star key={n} className={`w-3.5 h-3.5 ${n <= r.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-200"}`} />)}
                    </div>
                    <span className="text-[10px] text-[#393939] ml-auto">{new Date(r.created_at).toLocaleDateString("es-VE")}</span>
                  </div>
                  {r.comment && <p className="text-sm text-[#393939] font-medium">{r.comment}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Services */}
        {services.length > 0 && (
          <div>
            <h2 className="text-[24px] font-bold mb-4">Servicios</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {services.map((service) => (
                <Link key={service.id} href={`/marketplace/${service.id}`}
                  className="bg-white border-4 border-black rounded-xl p-5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] transition-all">
                  {service.images?.[0] && (
                    <img src={service.images[0]} alt="" className="w-full h-32 object-cover rounded-lg border-2 border-black mb-3" />
                  )}
                  <div className="flex items-center justify-between mb-2">
                    <span className="bg-ve-blue text-white border-2 border-black rounded-lg px-2.5 py-0.5 text-xs font-bold">{service.categoria}</span>
                  </div>
                  <h3 className="text-lg font-bold mb-1">{service.titulo}</h3>
                  <p className="text-sm text-[#393939] line-clamp-2 mb-3">{service.descripcion}</p>
                  <div className="flex items-center justify-between border-t-2 border-black/10 pt-3">
                    <span className="text-sm font-bold text-[#2775CA]">${service.precio_usdc.toFixed(2)} USDC</span>
                    <span className="text-xs font-bold text-[#393939] flex items-center gap-1"><Clock className="w-3 h-3" />{service.delivery_days} días</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {services.length === 0 && portfolio.length === 0 && (
          <div className="bg-white border-4 border-black rounded-xl p-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-center">
            <p className="text-[#393939] font-medium">Este usuario aún no tiene contenido publicado.</p>
          </div>
        )}
      </div>
    </>
  );
}
