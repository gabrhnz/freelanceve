"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Navigation } from "@/components/navigation";
import { useSession } from "@/contexts/session-context";
import { useWallet } from "@solana/wallet-adapter-react";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { AnchorProvider } from "@coral-xyz/anchor";
import {
  getServiceById,
  getProfileByEmail,
  getProfileByWallet,
  getProfileById,
  createOrder,
  createReport,
  Service,
  Profile,
} from "@/lib/supabase";
import { getConnection, placeOrderOnChain, findOnChainService, publishServiceOnChain, checkServiceExistsOnChain } from "@/lib/program";
import { PublicKey } from "@solana/web3.js";
import {
  ArrowLeft,
  Clock,
  User,
  Briefcase,
  CheckCircle,
  ShieldCheck,
  Wallet,
  AlertTriangle,
  Loader2,
  MessageSquare,
  Flag,
  X,
  ChevronLeft,
  ChevronRight,
  Play,
} from "lucide-react";
import toast from "react-hot-toast";
import { useLanguage } from "@/contexts/language-context";
import { useTranslate } from "@/hooks/useTranslate";

// Fiverr-style carousel for images + YouTube
function ServiceCarousel({ slides }: { slides: { type: "image" | "youtube"; url: string }[] }) {
  const [current, setCurrent] = useState(0);
  const total = slides.length;
  const prev = () => setCurrent((c) => (c - 1 + total) % total);
  const next = () => setCurrent((c) => (c + 1) % total);

  return (
    <div className="mt-4 relative group">
      <div className="rounded-xl overflow-hidden border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-black">
        <div className="relative" style={{ paddingBottom: "56.25%" }}>
          {slides.map((slide, i) => (
            <div key={i} className={`absolute inset-0 transition-opacity duration-500 ${i === current ? "opacity-100 z-10" : "opacity-0 z-0"}`}>
              {slide.type === "image" ? (
                <img src={slide.url} alt={`Slide ${i + 1}`} className="w-full h-full object-contain bg-black" />
              ) : (
                <iframe
                  src={`https://www.youtube.com/embed/${slide.url}`}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Arrows */}
      {total > 1 && (
        <>
          <button onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white/90 border-2 border-black rounded-full flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white/90 border-2 border-black rounded-full flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white">
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* Dots */}
      {total > 1 && (
        <div className="flex justify-center gap-2 mt-3">
          {slides.map((s, i) => (
            <button key={i} onClick={() => setCurrent(i)}
              className={`w-2.5 h-2.5 rounded-full border border-black transition-all ${
                i === current ? "bg-[#9945FF] scale-125" : "bg-gray-300 hover:bg-gray-400"
              }`} />
          ))}
        </div>
      )}

      {/* Counter badge */}
      {total > 1 && (
        <div className="absolute top-3 right-3 z-20 bg-black/70 text-white text-[10px] font-bold px-2 py-1 rounded-lg">
          {current + 1} / {total}
        </div>
      )}
    </div>
  );
}

export default function ServiceDetailPage() {
  const params = useParams();
  const serviceId = params.id as string;
  const router = useRouter();
  const { user } = useSession();
  const { publicKey, connected } = useWallet();
  const anchorWallet = useAnchorWallet();

  const [service, setService] = useState<Service | null>(null);
  const [myProfile, setMyProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState(false);
  const [onChainReady, setOnChainReady] = useState<boolean | null>(null);
  const [checkingOnChain, setCheckingOnChain] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [reporting, setReporting] = useState(false);
  const { language, t } = useLanguage();
  const { translateBatch } = useTranslate();
  const [translated, setTranslated] = useState<{ titulo: string; descripcion: string } | null>(null);

  const fetchService = useCallback(async () => {
    const data = await getServiceById(serviceId);
    setService(data);
    setLoading(false);
  }, [serviceId]);

  // Translate service content when language changes
  useEffect(() => {
    if (!service) return;
    const texts = [service.titulo || "", service.descripcion || ""];
    translateBatch(texts).then(([titulo, descripcion]) => {
      setTranslated({ titulo: titulo || service.titulo, descripcion: descripcion || service.descripcion || "" });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [service, language]);

  const fetchMyProfile = useCallback(async () => {
    let p: Profile | null = null;
    if (user?.email) {
      p = await getProfileByEmail(user.email);
    }
    if (!p && publicKey) {
      p = await getProfileByWallet(publicKey.toBase58());
    }
    setMyProfile(p);
  }, [user?.email, publicKey]);

  // Check if the freelancer's service exists on-chain
  const checkOnChainStatus = useCallback(async (svc: Service) => {
    let freelancerWallet = svc.owner?.wallet_address;
    if (!freelancerWallet) {
      const fp = await getProfileById(svc.owner_id);
      freelancerWallet = fp?.wallet_address || null;
    }
    if (!freelancerWallet) {
      setOnChainReady(false);
      return;
    }
    try {
      setCheckingOnChain(true);
      const exists = await checkServiceExistsOnChain(freelancerWallet);
      setOnChainReady(exists);
    } catch {
      setOnChainReady(false);
    } finally {
      setCheckingOnChain(false);
    }
  }, []);

  useEffect(() => {
    fetchService();
    fetchMyProfile();
  }, [fetchService, fetchMyProfile]);

  // Check on-chain status when service is loaded
  useEffect(() => {
    if (service) {
      checkOnChainStatus(service);
    }
  }, [service, checkOnChainStatus]);

  const isOwner = myProfile?.id === service?.owner_id;

  // Owner publishes their own service on-chain
  const handlePublishOnChain = async () => {
    if (!service || !myProfile || !connected || !anchorWallet || !publicKey) return;
    setPublishing(true);
    try {
      const connection = getConnection();
      const provider = new AnchorProvider(connection, anchorWallet, { commitment: "confirmed" });

      await publishServiceOnChain(
        provider,
        {
          nombre: myProfile.nombre || "Freelancer",
          bio: myProfile.bio || "",
          categoria: myProfile.categoria || service.categoria,
          skills: myProfile.skills || [],
        },
        {
          titulo: service.titulo,
          descripcion: service.descripcion,
          precioUsdc: service.precio_usdc,
          deliveryDays: service.delivery_days,
          categoria: service.categoria,
        },
      );

      toast.success("¡Servicio publicado on-chain exitosamente!");
      setOnChainReady(true);
    } catch (err: any) {
      console.error(err);
      const msg = err?.message || "";
      if (msg.includes("User rejected")) {
        toast.error("Transacción cancelada");
      } else if (msg.includes("insufficient")) {
        toast.error("No tienes suficiente SOL para las fees");
      } else {
        toast.error(msg.slice(0, 120) || "Error al publicar on-chain");
      }
    } finally {
      setPublishing(false);
    }
  };

  const handleOrder = async () => {
    if (!myProfile || !service) return;
    if (isOwner) {
      toast.error("No puedes contratar tu propio servicio");
      return;
    }
    if (!connected || !anchorWallet || !publicKey) {
      toast.error("Conecta tu wallet para pagar con USDC");
      return;
    }

    setOrdering(true);
    try {
      let freelancerWallet = service.owner?.wallet_address;
      if (!freelancerWallet) {
        const freelancerProfile = await getProfileById(service.owner_id);
        freelancerWallet = freelancerProfile?.wallet_address || null;
      }
      if (!freelancerWallet) {
        toast.error("El freelancer no tiene wallet configurada");
        setOrdering(false);
        return;
      }

      const freelancerPubkey = new PublicKey(freelancerWallet);
      const connection = getConnection();
      const provider = new AnchorProvider(connection, anchorWallet, {
        commitment: "confirmed",
      });

      const { servicePDA } = await findOnChainService(provider, freelancerPubkey);
      const txSignature = await placeOrderOnChain(provider, servicePDA);

      const order = await createOrder({
        service_id: service.id,
        client_id: myProfile.id,
        freelancer_id: service.owner_id,
        amount_usdc: service.precio_usdc,
        status: "in_progress",
        tx_signature: txSignature,
        accepted_at: null,
      });

      if (order) {
        toast.success("¡Orden creada! USDC en escrow.");
        // Notify freelancer via email
        const freelancerEmail = service.owner?.email;
        if (freelancerEmail) {
          fetch("/api/notify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "new_order",
              to: freelancerEmail,
              data: {
                serviceTitle: service.titulo,
                amount: service.precio_usdc,
                clientName: myProfile.nombre,
                orderUrl: `https://frontend-mauve-kappa-18.vercel.app/orders/${order.id}`,
              },
            }),
          }).catch(() => {});
        }
        router.push(`/orders/${order.id}`);
      } else {
        toast.success("Transacción exitosa en Solana, pero hubo un error guardando la orden");
        router.push("/dashboard");
      }
    } catch (err: any) {
      console.error(err);
      const msg = err?.message || "Error al procesar la orden";
      if (msg === "PROFILE_NOT_INITIALIZED" || msg === "SERVICE_NOT_INITIALIZED") {
        toast.error("El servicio aún no está disponible on-chain. El freelancer debe publicarlo primero.");
        setOnChainReady(false);
      } else if (msg.includes("insufficient") || msg.includes("0x1")) {
        toast.error("No tienes suficiente USDC para esta orden");
      } else if (msg.includes("User rejected")) {
        toast.error("Transacción cancelada");
      } else {
        toast.error(msg.slice(0, 120));
      }
    } finally {
      setOrdering(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navigation />
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-black border-t-transparent" />
        </div>
      </>
    );
  }

  if (!service) {
    return (
      <>
        <Navigation />
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="bg-white border-4 border-black rounded-xl p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-center max-w-md mx-4">
            <Briefcase className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-xl font-bold mb-2">Servicio no encontrado</p>
            <Link
              href="/marketplace"
              className="inline-flex items-center gap-2 mt-4 bg-black text-white border-3 border-black rounded-lg px-5 py-2.5 font-bold text-sm shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
            >
              <ArrowLeft className="w-4 h-4" /> Volver al Marketplace
            </Link>
          </div>
        </div>
      </>
    );
  }

  // Render the order/action sidebar content
  const renderSidebarAction = () => {
    if (!user && !connected) {
      return (
        <Link
          href="/register"
          className="block w-full bg-black text-white border-4 border-black rounded-xl py-4 font-bold text-lg text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all"
        >
          Registrarse para contratar
        </Link>
      );
    }

    if (!connected) {
      return (
        <div className="bg-[#F5F5F5] border-3 border-black/10 rounded-xl p-4 text-center">
          <Wallet className="w-5 h-5 mx-auto mb-2 text-[#393939]" />
          <p className="text-sm font-bold text-[#393939]">Conecta tu wallet para pagar con USDC</p>
        </div>
      );
    }

    if (isOwner) {
      // Owner sees publish button if not on-chain
      if (onChainReady === false) {
        return (
          <div className="space-y-3">
            <div className="bg-[#FFF3CD] border-3 border-black rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-orange-600" />
              <div>
                <p className="text-sm font-bold">Servicio no publicado on-chain</p>
                <p className="text-xs text-[#393939] mt-1">Los clientes no pueden contratar este servicio hasta que lo publiques en Solana.</p>
              </div>
            </div>
            <button
              onClick={handlePublishOnChain}
              disabled={publishing}
              className="w-full bg-[#9945FF] text-white border-4 border-black rounded-xl py-4 font-bold text-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
            >
              {publishing ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Publicando...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <ShieldCheck className="w-5 h-5" />
                  Publicar on-chain
                </span>
              )}
            </button>
          </div>
        );
      }
      return (
        <div className="bg-[#F5F5F5] border-3 border-black/10 rounded-xl p-4 text-center">
          <User className="w-5 h-5 mx-auto mb-2 text-[#393939]" />
          <p className="text-sm font-bold text-[#393939]">Este es tu servicio</p>
        </div>
      );
    }

    // Client view - check on-chain status
    if (checkingOnChain || onChainReady === null) {
      return (
        <div className="bg-[#F5F5F5] border-3 border-black/10 rounded-xl p-4 text-center">
          <Loader2 className="w-5 h-5 mx-auto mb-2 text-[#393939] animate-spin" />
          <p className="text-sm font-bold text-[#393939]">Verificando disponibilidad on-chain...</p>
        </div>
      );
    }

    if (onChainReady === false) {
      return (
        <div className="bg-[#FFF3CD] border-3 border-black rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-orange-600" />
          <div>
            <p className="text-sm font-bold">Servicio no disponible on-chain</p>
            <p className="text-xs text-[#393939] mt-1">El freelancer debe publicar su servicio en Solana antes de que puedas contratarlo.</p>
          </div>
        </div>
      );
    }

    return (
      <button
        onClick={handleOrder}
        disabled={ordering}
        className="w-full bg-[#9945FF] text-white border-4 border-black rounded-xl py-4 font-bold text-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
      >
        {ordering ? (
          <span className="flex items-center justify-center gap-2">
            <span className="h-5 w-5 animate-spin rounded-full border-3 border-white border-t-transparent" />
            Procesando...
          </span>
        ) : (
          "Contratar Servicio"
        )}
      </button>
    );
  };

  return (
    <>
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back link */}
        <Link
          href="/marketplace"
          className="inline-flex items-center gap-2 text-sm font-bold text-[#393939] hover:text-black mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Volver al Marketplace
        </Link>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Service card */}
            <div className="bg-white border-4 border-black rounded-xl p-6 sm:p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex items-center gap-3 mb-4">
                <span className="bg-ve-blue text-white border-2 border-black rounded-lg px-3 py-1 text-xs font-bold">
                  {service.categoria}
                </span>
                {service.activo && (
                  <span className="bg-green-100 text-green-800 border-2 border-black rounded-lg px-3 py-1 text-xs font-bold">
                    {t.common.available}
                  </span>
                )}
                {onChainReady === true && (
                  <span className="bg-purple-100 text-purple-800 border-2 border-black rounded-lg px-3 py-1 text-xs font-bold flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> On-chain
                  </span>
                )}
              </div>

              <h1 className="text-[28px] md:text-[36px] font-bold leading-tight mb-4">
                {translated?.titulo || service.titulo}
              </h1>

              <p className="text-[#393939] text-[16px] font-medium leading-relaxed whitespace-pre-wrap">
                {translated?.descripcion || service.descripcion}
              </p>

              {/* Fiverr-style Media Carousel */}
              {(() => {
                const slides: { type: "image" | "youtube"; url: string }[] = [];
                if (service.images && service.images.length > 0) {
                  service.images.forEach((url: string) => slides.push({ type: "image", url }));
                }
                if (service.youtube_url) {
                  const ym = service.youtube_url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
                  if (ym?.[1]) slides.push({ type: "youtube", url: ym[1] });
                }
                if (slides.length === 0) return null;

                return <ServiceCarousel slides={slides} />;
              })()}
            </div>

            {/* Freelancer info */}
            {service.owner && (
              <div className="bg-white border-4 border-black rounded-xl p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <h3 className="font-bold text-lg mb-4">{t.serviceDetail.aboutFreelancer}</h3>
                <div className="flex items-start gap-4">
                  <Link href={`/u/${service.owner.username || service.owner.id}`} className="shrink-0 hover:opacity-80 transition-opacity">
                    <div className="w-14 h-14 bg-[#9945FF] rounded-xl border-3 border-black flex items-center justify-center text-xl font-bold text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                      {service.owner.avatar_url ? <img src={service.owner.avatar_url} alt="" className="w-full h-full object-cover" /> : service.owner.nombre?.charAt(0).toUpperCase() || "?"}
                    </div>
                  </Link>
                  <div className="flex-1">
                    <Link href={`/u/${service.owner.username || service.owner.id}`} className="font-bold text-lg hover:text-[#9945FF] hover:underline transition-colors">{service.owner.nombre}</Link>
                    {service.owner.categoria && (
                      <span className="inline-block mt-1 bg-ve-yellow border-2 border-black rounded-lg px-2 py-0.5 text-xs font-bold">
                        {service.owner.categoria}
                      </span>
                    )}
                    {service.owner.bio && (
                      <p className="text-[#393939] text-sm font-medium mt-2">
                        {service.owner.bio}
                      </p>
                    )}
                    {service.owner.skills && service.owner.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {service.owner.skills.map((s) => (
                          <span
                            key={s}
                            className="bg-[#F5F5F5] border-2 border-black/20 rounded-lg px-2 py-0.5 text-[10px] font-bold"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - Order */}
          <div className="space-y-4">
            <div className="bg-white border-4 border-black rounded-xl p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] sticky top-8">
              <p className="text-[32px] font-bold text-[#2775CA] mb-1">
                ${service.precio_usdc}
              </p>
              <p className="text-sm font-bold text-[#393939] mb-6">USDC</p>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="w-4 h-4 text-[#393939]" />
                  <span className="font-medium">{t.common.deliveryIn} <span className="font-bold">{service.delivery_days} {t.common.days}</span></span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <ShieldCheck className="w-4 h-4 text-[#393939]" />
                  <span className="font-medium">{t.serviceDetail.escrowProtected}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <CheckCircle className="w-4 h-4 text-[#393939]" />
                  <span className="font-medium">{language === 'en' ? 'Guaranteed refund' : 'Reembolso garantizado'}</span>
                </div>
              </div>

              {renderSidebarAction()}

              {/* Contact + Report buttons */}
              {!isOwner && myProfile && service.owner && (
                <div className="mt-4 space-y-2">
                  <Link href={`/chat/${service.owner_id}`}
                    className="flex items-center justify-center gap-2 w-full bg-white text-black border-3 border-black rounded-xl py-3 font-bold text-sm shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] transition-all">
                    <MessageSquare className="w-4 h-4" /> {t.serviceDetail.contactFreelancer}
                  </Link>
                  <button onClick={() => setShowReport(true)}
                    className="flex items-center justify-center gap-2 w-full text-[#393939] hover:text-red-600 text-xs font-bold py-2 transition-colors">
                    <Flag className="w-3 h-3" /> {t.serviceDetail.report}
                  </button>
                </div>
              )}

              {/* T&C link */}
              <p className="text-center mt-4">
                <Link href="/terms" className="text-[10px] font-bold text-[#393939] hover:underline">
                  Términos y Condiciones
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Report Modal */}
        {showReport && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white border-4 border-black rounded-xl p-6 max-w-md w-full shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg flex items-center gap-2"><Flag className="w-5 h-5 text-red-500" /> {t.serviceDetail.reportService}</h3>
                <button onClick={() => setShowReport(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#F5F5F5]"><X className="w-5 h-5" /></button>
              </div>
              <p className="text-sm text-[#393939]">Si este anuncio viola los <Link href="/terms" className="underline font-bold">Términos y Condiciones</Link>, por favor selecciona un motivo:</p>
              <select value={reportReason} onChange={(e) => setReportReason(e.target.value)}
                className="w-full border-3 border-black rounded-lg px-4 py-3 text-sm font-medium focus:outline-none">
                <option value="">Selecciona un motivo</option>
                <option value="fraude">Fraude o estafa</option>
                <option value="contenido_inapropiado">Contenido inapropiado</option>
                <option value="propiedad_intelectual">Violación de propiedad intelectual</option>
                <option value="servicio_ilegal">Servicio ilegal</option>
                <option value="spam">Spam o publicidad engañosa</option>
                <option value="otro">Otro</option>
              </select>
              <textarea value={reportDetails} onChange={(e) => setReportDetails(e.target.value)}
                placeholder="Describe el problema con más detalle (opcional)..."
                rows={3}
                className="w-full border-3 border-black rounded-lg px-4 py-3 text-sm font-medium placeholder:text-gray-400 focus:outline-none resize-none" />
              <div className="flex gap-3">
                <button onClick={() => setShowReport(false)}
                  className="flex-1 bg-white border-3 border-black rounded-xl py-3 font-bold text-sm hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all">
                  Cancelar
                </button>
                <button disabled={!reportReason || reporting} onClick={async () => {
                  if (!myProfile || !reportReason) return;
                  setReporting(true);
                  const r = await createReport({
                    reporter_id: myProfile.id,
                    reported_service_id: service.id,
                    reported_user_id: service.owner_id,
                    reason: reportReason,
                    details: reportDetails.trim() || undefined,
                  });
                  setReporting(false);
                  if (r) {
                    toast.success("Reporte enviado. Será revisado en 48h.");
                    setShowReport(false); setReportReason(""); setReportDetails("");
                  } else toast.error("Error al enviar reporte");
                }}
                  className="flex-1 bg-red-500 text-white border-3 border-black rounded-xl py-3 font-bold text-sm shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] disabled:opacity-40">
                  {reporting ? "Enviando..." : "Enviar Reporte"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
