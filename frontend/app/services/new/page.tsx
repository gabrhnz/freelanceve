"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CATEGORIES } from "@/lib/constants";
import { Navigation } from "@/components/navigation";
import { useSession } from "@/contexts/session-context";
import { useWallet } from "@solana/wallet-adapter-react";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { AnchorProvider } from "@coral-xyz/anchor";
import { getProfileByEmail, getProfileByWallet, createService, uploadFileToStorage, Profile } from "@/lib/supabase";
import { getConnection, publishServiceOnChain } from "@/lib/program";
import { Eye, Wallet, Clock, ShieldCheck, ExternalLink, Image as ImageIcon, X, Loader2, Sparkles } from "lucide-react";
import toast from "react-hot-toast";

export default function NewServicePage() {
  const { user, loading: sessionLoading } = useSession();
  const { publicKey, connected } = useWallet();
  const anchorWallet = useAnchorWallet();
  const router = useRouter();

  const [myProfile, setMyProfile] = useState<Profile | null>(null);
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [precio, setPrecio] = useState("");
  const [deliveryDays, setDeliveryDays] = useState("7");
  const [categoria, setCategoria] = useState<string>(CATEGORIES[0]);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [serviceImages, setServiceImages] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [publishStep, setPublishStep] = useState("");
  const [enhancing, setEnhancing] = useState(false);

  const precioNum = parseFloat(precio) || 0;

  const handleEnhance = async () => {
    if (!titulo.trim() && !descripcion.trim()) {
      toast.error("Escribe al menos un título o descripción para mejorar");
      return;
    }
    setEnhancing(true);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "enhance",
          titulo: titulo.trim(),
          descripcion: descripcion.trim(),
          categoria,
        }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (data.titulo) setTitulo(data.titulo);
      if (data.descripcion) setDescripcion(data.descripcion);
      toast.success("¡Texto mejorado con IA!");
    } catch {
      toast.error("Error al mejorar con IA");
    } finally {
      setEnhancing(false);
    }
  };

  const fetchProfile = useCallback(async () => {
    let p: Profile | null = null;
    if (user?.email) {
      p = await getProfileByEmail(user.email);
    }
    if (!p && publicKey) {
      p = await getProfileByWallet(publicKey.toBase58());
    }
    setMyProfile(p);
  }, [user?.email, publicKey]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!myProfile) {
      toast.error("Necesitas un perfil para crear servicios");
      return;
    }
    if (!connected || !anchorWallet || !publicKey) {
      toast.error("Conecta tu wallet para publicar en la blockchain");
      return;
    }
    if (precioNum < 1) {
      toast.error("El precio mínimo es 1 USDC");
      return;
    }
    const days = parseInt(deliveryDays);
    if (days < 1 || days > 30) {
      toast.error("Los días de entrega deben ser entre 1 y 30");
      return;
    }

    setLoading(true);
    try {
      // Step 1: Publish on-chain (register profile if needed + create service)
      setPublishStep("Firmando en Solana...");
      const connection = getConnection();
      const provider = new AnchorProvider(connection, anchorWallet, {
        commitment: "confirmed",
      });

      await publishServiceOnChain(
        provider,
        {
          nombre: myProfile.nombre || "Freelancer",
          bio: myProfile.bio || "",
          categoria: myProfile.categoria || categoria,
          skills: myProfile.skills || [],
        },
        {
          titulo: titulo.trim(),
          descripcion: descripcion.trim(),
          precioUsdc: precioNum,
          deliveryDays: days,
          categoria,
        },
      );

      // Step 2: Save to Supabase
      setPublishStep("Guardando servicio...");
      const service = await createService({
        owner_id: myProfile.id,
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        precio_usdc: precioNum,
        delivery_days: days,
        categoria,
        activo: true,
        youtube_url: youtubeUrl.trim() || null,
        images: serviceImages.length > 0 ? serviceImages : null,
      });

      if (service) {
        toast.success("¡Servicio publicado on-chain y guardado!");
        router.push("/dashboard");
      } else {
        toast.error("Servicio creado en Solana pero falló al guardar en la base de datos");
      }
    } catch (err: any) {
      console.error(err);
      const msg = err?.message || "";
      if (msg.includes("User rejected")) {
        toast.error("Transacción cancelada");
      } else if (msg.includes("insufficient")) {
        toast.error("No tienes suficiente SOL para las fees de la transacción");
      } else {
        toast.error(msg.slice(0, 120) || "Error al publicar servicio");
      }
    } finally {
      setLoading(false);
      setPublishStep("");
    }
  };

  if (sessionLoading) {
    return (
      <>
        <Navigation />
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-black border-t-transparent" />
        </div>
      </>
    );
  }

  if (!user && !connected) {
    return (
      <>
        <Navigation />
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="bg-white border-4 border-black rounded-xl p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-center max-w-md mx-4">
            <Wallet className="w-12 h-12 mx-auto mb-4" />
            <p className="text-xl font-bold mb-2">Inicia sesión</p>
            <p className="text-[#393939] mb-4">Necesitas registrarte y conectar tu wallet para crear un servicio.</p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-black text-white border-4 border-black rounded-xl px-6 py-3 font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all"
            >
              Registrarse
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <h1 className="text-[32px] md:text-[42px] font-bold leading-tight mb-2">
          Publicar <span className="bg-[#FF6B7A] text-white px-2">Servicio</span>
        </h1>
        <p className="text-[#393939] text-[16px] font-medium mb-8">
          Crea un servicio y empieza a recibir órdenes en USDC.
        </p>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="bg-white border-4 border-black rounded-xl p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-5">
              <div>
                <label className="block text-sm font-bold mb-2">
                  Título <span className="text-ve-red">*</span>
                </label>
                <input
                  type="text"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  maxLength={100}
                  placeholder="Ej: Diseño de logo profesional"
                  className="w-full border-3 border-black rounded-lg px-4 py-3 text-[16px] font-medium placeholder:text-gray-400 focus:outline-none focus:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-shadow"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">
                  Descripción <span className="text-ve-red">*</span>
                </label>
                <textarea
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  maxLength={500}
                  rows={4}
                  placeholder="Describe tu servicio en detalle..."
                  className="w-full border-3 border-black rounded-lg px-4 py-3 text-[16px] font-medium placeholder:text-gray-400 focus:outline-none focus:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-shadow resize-none"
                  required
                />
                <div className="mt-1 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleEnhance}
                    disabled={enhancing || (!titulo.trim() && !descripcion.trim())}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#9945FF] hover:text-[#7B2FD4] disabled:opacity-40 transition-colors"
                  >
                    {enhancing ? (
                      <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Mejorando...</>
                    ) : (
                      <><Sparkles className="w-3.5 h-3.5" /> Mejorar con IA</>
                    )}
                  </button>
                  <span className="text-xs text-gray-400">{descripcion.length}/500</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-2">
                    Precio (USDC) <span className="text-ve-red">*</span>
                  </label>
                  <input
                    type="number"
                    value={precio}
                    onChange={(e) => setPrecio(e.target.value)}
                    min="1"
                    step="0.01"
                    placeholder="5.00"
                    className="w-full border-3 border-black rounded-lg px-4 py-3 text-[16px] font-medium placeholder:text-gray-400 focus:outline-none focus:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-shadow"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2">
                    Días entrega <span className="text-ve-red">*</span>
                  </label>
                  <input
                    type="number"
                    value={deliveryDays}
                    onChange={(e) => setDeliveryDays(e.target.value)}
                    min="1"
                    max="30"
                    className="w-full border-3 border-black rounded-lg px-4 py-3 text-[16px] font-medium placeholder:text-gray-400 focus:outline-none focus:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-shadow"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">Categoría</label>
                <select
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  className="w-full border-3 border-black rounded-lg px-4 py-3 text-[16px] font-medium bg-white focus:outline-none focus:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-shadow"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* YouTube URL */}
              <div>
                <label className="block text-sm font-bold mb-2 flex items-center gap-1"><ExternalLink className="w-4 h-4 text-red-500" /> Video de presentación YouTube (opcional)</label>
                <input
                  type="url"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                  className="w-full border-3 border-black rounded-lg px-4 py-3 text-[16px] font-medium placeholder:text-gray-400 focus:outline-none focus:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-shadow"
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-bold mb-2 flex items-center gap-1"><ImageIcon className="w-4 h-4" /> Imágenes del servicio (máx. 3)</label>
                <div className="flex gap-2 flex-wrap">
                  {serviceImages.map((url, i) => (
                    <div key={i} className="relative w-24 h-24">
                      <img src={url} alt="" className="w-full h-full object-cover rounded-lg border-3 border-black" />
                      <button type="button" onClick={() => setServiceImages(prev => prev.filter((_, j) => j !== i))}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full border-2 border-black flex items-center justify-center">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {serviceImages.length < 3 && (
                    <label className={`w-24 h-24 border-3 border-dashed border-black rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-[#F5F5F5] transition-colors ${uploadingImage ? "opacity-50" : ""}`}>
                      {uploadingImage ? <Loader2 className="w-5 h-5 animate-spin" /> : <><ImageIcon className="w-5 h-5 text-gray-400 mb-1" /><span className="text-[10px] font-bold text-gray-400">Subir</span></>}
                      <input type="file" className="hidden" accept="image/*" disabled={uploadingImage}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (file.size > 5 * 1024 * 1024) { toast.error("Máx 5MB"); return; }
                          setUploadingImage(true);
                          const url = await uploadFileToStorage(file);
                          if (url) setServiceImages(prev => [...prev, url]);
                          else toast.error("Error al subir imagen");
                          setUploadingImage(false);
                          e.target.value = "";
                        }}
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>

            {!connected && (
              <div className="bg-[#FFF3CD] border-3 border-black rounded-xl p-4 flex items-center gap-3">
                <Wallet className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm font-bold">Conecta tu wallet para firmar y publicar el servicio en Solana</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !titulo.trim() || precioNum < 1 || !connected}
              className="w-full bg-[#9945FF] text-white border-4 border-black rounded-xl py-4 font-bold text-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="h-5 w-5 animate-spin rounded-full border-3 border-white border-t-transparent" />
                  {publishStep || "Publicando..."}
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5" />
                  {`Firmar y publicar por $${precioNum.toFixed(2)} USDC`}
                </span>
              )}
            </button>

            <p className="text-xs text-center text-[#393939] font-medium">
              Se firmará en la blockchain de Solana. Necesitas SOL para las fees.
            </p>
          </form>

          {/* Live preview */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Eye className="w-4 h-4 text-[#393939]" />
              <h3 className="text-sm font-bold text-[#393939]">Vista previa</h3>
            </div>
            <div className="bg-white border-4 border-black rounded-xl p-5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <div className="mb-3 flex items-center justify-between">
                <span className="bg-ve-blue text-white border-2 border-black rounded-lg px-2.5 py-0.5 text-xs font-bold">
                  {categoria}
                </span>
                <span className="rounded-lg px-2 py-0.5 text-[10px] font-bold border-2 border-black bg-ve-yellow">
                  Activo
                </span>
              </div>
              <h3 className="mb-1 text-lg font-bold">
                {titulo || "Título del servicio"}
              </h3>
              <p className="mb-3 line-clamp-2 text-sm text-[#393939] font-medium">
                {descripcion || "Descripción del servicio..."}
              </p>
              {/* Preview images */}
              {serviceImages.length > 0 && (
                <div className="flex gap-2 mb-3 overflow-x-auto">
                  {serviceImages.map((url, i) => (
                    <img key={i} src={url} alt="" className="w-16 h-16 rounded-lg border-2 border-black object-cover flex-shrink-0" />
                  ))}
                </div>
              )}
              {youtubeUrl && (
                <p className="text-[10px] text-red-500 font-bold mb-2">▶ Video de YouTube adjunto</p>
              )}
              <div className="flex items-center justify-between border-t-3 border-black/10 pt-3">
                <span className="text-sm font-bold text-[#2775CA]">
                  ${precioNum > 0 ? precioNum.toFixed(2) : "0.00"} USDC
                </span>
                <span className="text-xs font-bold text-[#393939] flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {deliveryDays || "7"} días
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
