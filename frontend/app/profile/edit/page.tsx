"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { Navigation } from "@/components/navigation";
import { useSession } from "@/contexts/session-context";
import {
  Profile, SocialLinks, PortfolioItem, Order, Review,
  getProfileByEmail, getProfileByWallet,
  updateProfileById, getProfileByUsername,
  getOrdersByUser, getReviewsByFreelancer,
  supabase, uploadFileToStorage,
} from "@/lib/supabase";
import {
  Camera, Copy, Check, Link as LinkIcon, User, Save,
  AtSign, Globe, Trash2, Plus, FileText, Image as ImageIcon, Loader2,
  TrendingUp, Package, Star, DollarSign, BarChart3,
} from "lucide-react";
import toast from "react-hot-toast";

export default function ProfileEditPage() {
  const { publicKey } = useWallet();
  const { user } = useSession();
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const [nombre, setNombre] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  // Social links
  const [twitter, setTwitter] = useState("");
  const [instagram, setInstagram] = useState("");
  const [website, setWebsite] = useState("");

  // Portfolio
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);

  // Stats
  const [orders, setOrders] = useState<Order[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [portfolioUploading, setPortfolioUploading] = useState(false);

  const fetchProfile = useCallback(async () => {
    let p: Profile | null = null;
    if (user?.email) p = await getProfileByEmail(user.email);
    if (!p && publicKey) p = await getProfileByWallet(publicKey.toBase58());
    if (!p) { router.push("/register"); return; }
    setProfile(p);
    setNombre(p.nombre || "");
    setUsername(p.username || "");
    setBio(p.bio || "");
    setAvatarUrl(p.avatar_url || "");
    setTwitter(p.social_links?.twitter || "");
    setInstagram(p.social_links?.instagram || "");
    setWebsite(p.social_links?.website || "");
    setPortfolio(p.portfolio || []);
    setLoading(false);

    // Fetch stats
    const [ords, revs] = await Promise.all([
      getOrdersByUser(p.id),
      getReviewsByFreelancer(p.id),
    ]);
    setOrders(ords);
    setReviews(revs);

    // Update last_seen
    supabase.from("profiles").update({ last_seen: new Date().toISOString() }).eq("id", p.id).then(() => {});
  }, [user?.email, publicKey, router]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    if (file.size > 2 * 1024 * 1024) { toast.error("Imagen máximo 2MB"); return; }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const filePath = `${profile.id}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file, { upsert: true });
      if (!uploadError) {
        const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
        await updateProfileById(profile.id, { avatar_url: data.publicUrl });
        setAvatarUrl(data.publicUrl);
        setProfile((prev) => prev ? { ...prev, avatar_url: data.publicUrl } : prev);
        toast.success("Foto actualizada");
      } else {
        // Fallback base64
        const reader = new FileReader();
        reader.onload = async () => {
          const img = new Image();
          img.onload = async () => {
            const canvas = document.createElement("canvas");
            const max = 200; let w = img.width, h = img.height;
            if (w > h) { h = (h / w) * max; w = max; } else { w = (w / h) * max; h = max; }
            canvas.width = w; canvas.height = h;
            canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
            const compressed = canvas.toDataURL("image/jpeg", 0.7);
            await updateProfileById(profile.id, { avatar_url: compressed });
            setAvatarUrl(compressed);
            toast.success("Foto actualizada");
            setUploading(false);
          };
          img.src = reader.result as string;
        };
        reader.readAsDataURL(file);
        return;
      }
    } catch { toast.error("Error al subir imagen"); }
    finally { setUploading(false); }
  };

  const handlePortfolioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    if (file.size > 30 * 1024 * 1024) { toast.error("Archivo máximo 30MB"); return; }
    const allowed = ["image/jpeg","image/png","image/gif","image/webp","application/pdf","video/mp4"];
    if (!allowed.includes(file.type)) { toast.error("Solo imágenes, PDF y MP4"); return; }

    setPortfolioUploading(true);
    try {
      const url = await uploadFileToStorage(file);
      if (!url) { toast.error("Error al subir. Verifica el bucket 'attachments'."); return; }
      const item: PortfolioItem = {
        title: file.name.replace(/\.[^/.]+$/, ""),
        url,
        file_url: url,
        file_type: file.type,
      };
      const updated = [...portfolio, item];
      setPortfolio(updated);
      await updateProfileById(profile.id, { portfolio: updated as any });
      toast.success("Archivo agregado al portafolio");
    } catch { toast.error("Error al subir archivo"); }
    finally { setPortfolioUploading(false); }
  };

  const removePortfolioItem = async (index: number) => {
    if (!profile) return;
    const updated = portfolio.filter((_, i) => i !== index);
    setPortfolio(updated);
    await updateProfileById(profile.id, { portfolio: updated as any });
    toast.success("Eliminado del portafolio");
  };

  const handleSave = async () => {
    if (!profile) return;
    if (!nombre.trim()) { toast.error("El nombre es requerido"); return; }
    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
    if (cleanUsername && cleanUsername !== profile.username) {
      const existing = await getProfileByUsername(cleanUsername);
      if (existing && existing.id !== profile.id) { toast.error("Nombre de usuario en uso"); return; }
    }
    setSaving(true);
    try {
      const socialLinks: SocialLinks = {};
      if (twitter.trim()) socialLinks.twitter = twitter.trim();
      if (instagram.trim()) socialLinks.instagram = instagram.trim();
      if (website.trim()) socialLinks.website = website.trim();

      const { data, error } = await supabase
        .from("profiles")
        .update({
          nombre: nombre.trim(),
          username: cleanUsername || null,
          bio: bio.trim() || null,
          avatar_url: avatarUrl || null,
          social_links: socialLinks,
          portfolio: portfolio,
        })
        .eq("id", profile.id)
        .select()
        .single();

      if (error) {
        console.error("Save error:", error);
        toast.error(`Error: ${error.message}`);
        return;
      }
      if (data) {
        setProfile(data as Profile);
        toast.success("Perfil actualizado ✓");
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const shareUrl = profile?.username
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/u/${profile.username}`
    : profile?.id ? `${typeof window !== "undefined" ? window.location.origin : ""}/u/${profile.id}` : "";

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true); toast.success("Link copiado");
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (<><Navigation /><div className="flex min-h-[60vh] items-center justify-center"><div className="h-12 w-12 animate-spin rounded-full border-4 border-black border-t-transparent" /></div></>);
  }

  return (
    <>
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-[32px] md:text-[42px] font-bold leading-tight mb-8">
          Mi <span className="bg-ve-yellow px-2">Perfil</span>
        </h1>

        <div className="space-y-6">
          {/* Stats Cards */}
          {(() => {
            const completed = orders.filter((o) => o.status === "completed");
            const asFreelancer = completed.filter((o) => o.freelancer_id === profile?.id);
            const totalEarned = asFreelancer.reduce((s, o) => s + o.amount_usdc, 0);
            const avgRating = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
            const activeOrders = orders.filter((o) => ["pending","accepted","in_progress","delivered"].includes(o.status));

            // Monthly income (last 6 months)
            const months: { label: string; amount: number }[] = [];
            for (let i = 5; i >= 0; i--) {
              const d = new Date(); d.setMonth(d.getMonth() - i);
              const label = d.toLocaleDateString("es-VE", { month: "short" });
              const month = d.getMonth(); const year = d.getFullYear();
              const amount = asFreelancer
                .filter((o) => { const od = new Date(o.created_at); return od.getMonth() === month && od.getFullYear() === year; })
                .reduce((s, o) => s + o.amount_usdc, 0);
              months.push({ label, amount });
            }
            const maxMonth = Math.max(...months.map((m) => m.amount), 1);

            return (
              <div className="bg-white border-4 border-black rounded-xl p-6 md:p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-5">
                <h2 className="text-xl font-bold flex items-center gap-2"><BarChart3 className="w-5 h-5" /> Estadísticas</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-[#F5F5F5] border-2 border-black rounded-lg p-3 text-center">
                    <DollarSign className="w-5 h-5 mx-auto mb-1 text-green-600" />
                    <p className="text-lg font-bold">${totalEarned.toFixed(0)}</p>
                    <p className="text-[10px] font-bold text-[#393939]">Ganado</p>
                  </div>
                  <div className="bg-[#F5F5F5] border-2 border-black rounded-lg p-3 text-center">
                    <Package className="w-5 h-5 mx-auto mb-1 text-blue-600" />
                    <p className="text-lg font-bold">{asFreelancer.length}</p>
                    <p className="text-[10px] font-bold text-[#393939]">Completadas</p>
                  </div>
                  <div className="bg-[#F5F5F5] border-2 border-black rounded-lg p-3 text-center">
                    <Star className="w-5 h-5 mx-auto mb-1 text-yellow-500" />
                    <p className="text-lg font-bold">{avgRating > 0 ? avgRating.toFixed(1) : "—"}</p>
                    <p className="text-[10px] font-bold text-[#393939]">{reviews.length} reseñas</p>
                  </div>
                  <div className="bg-[#F5F5F5] border-2 border-black rounded-lg p-3 text-center">
                    <TrendingUp className="w-5 h-5 mx-auto mb-1 text-[#9945FF]" />
                    <p className="text-lg font-bold">{activeOrders.length}</p>
                    <p className="text-[10px] font-bold text-[#393939]">Activas</p>
                  </div>
                </div>

                {/* Monthly income chart */}
                <div>
                  <p className="text-sm font-bold mb-3">Ingresos mensuales (USDC)</p>
                  <div className="flex items-end gap-2 h-28">
                    {months.map((m, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-[9px] font-bold text-[#393939]">{m.amount > 0 ? `$${m.amount.toFixed(0)}` : ""}</span>
                        <div
                          className="w-full rounded-t-md border-2 border-black transition-all"
                          style={{
                            height: `${Math.max((m.amount / maxMonth) * 80, 4)}px`,
                            background: m.amount > 0 ? "linear-gradient(180deg, #9945FF, #14F195)" : "#E5E7EB",
                          }}
                        />
                        <span className="text-[9px] font-bold">{m.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}
          {/* Avatar + Basic Info Card */}
          <div className="bg-white border-4 border-black rounded-xl p-6 md:p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-6">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-24 h-24 rounded-full border-4 border-black overflow-hidden bg-[#F5F5F5] flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                  {avatarUrl ? <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" /> : <User className="w-10 h-10 text-[#393939]" />}
                </div>
                <label className="absolute bottom-0 right-0 w-8 h-8 bg-[#9945FF] border-2 border-black rounded-full flex items-center justify-center cursor-pointer hover:bg-[#8035E0] transition-colors">
                  <Camera className="w-4 h-4 text-white" />
                  <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                </label>
              </div>
              {uploading && <span className="text-sm font-bold text-[#393939]">Subiendo...</span>}
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">Nombre</label>
              <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)}
                className="w-full border-3 border-black rounded-lg px-4 py-3 text-[16px] font-medium focus:outline-none focus:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-shadow"
                placeholder="Tu nombre" />
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">Nombre de usuario</label>
              <div className="flex items-center gap-2">
                <span className="text-[#393939] font-bold">@</span>
                <input type="text" value={username} onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
                  className="flex-1 border-3 border-black rounded-lg px-4 py-3 text-[16px] font-medium focus:outline-none focus:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-shadow"
                  placeholder="miusuario" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">Bio</label>
              <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3}
                className="w-full border-3 border-black rounded-lg px-4 py-3 text-[16px] font-medium resize-none focus:outline-none focus:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-shadow"
                placeholder="Cuéntanos sobre ti..." />
            </div>

            {shareUrl && (
              <div>
                <label className="block text-sm font-bold mb-2 flex items-center gap-2"><LinkIcon className="w-4 h-4" /> Link de tu perfil</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-[#F5F5F5] border-3 border-black rounded-lg px-4 py-3 text-[14px] font-medium truncate">{shareUrl}</div>
                  <button onClick={copyLink} className="flex-shrink-0 w-12 h-12 bg-ve-yellow border-3 border-black rounded-lg flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all">
                    {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            )}

            <div className="border-t-3 border-black/10 pt-4 space-y-2">
              <p className="text-sm text-[#393939]"><span className="font-bold">Email:</span> {profile?.email || "No configurado"}</p>
              <p className="text-sm text-[#393939]"><span className="font-bold">Wallet:</span> {profile?.wallet_address || "No conectada"}</p>
              <p className="text-sm text-[#393939]"><span className="font-bold">Rol:</span> {profile?.role}</p>
              <p className="text-sm text-[#393939]"><span className="font-bold">Categoría:</span> {profile?.categoria || "—"}</p>
            </div>
          </div>

          {/* Social Links Card */}
          <div className="bg-white border-4 border-black rounded-xl p-6 md:p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-5">
            <h2 className="text-xl font-bold">Redes Sociales</h2>

            <div>
              <label className="flex items-center gap-2 text-sm font-bold mb-2">
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                X (Twitter)
              </label>
              <input type="text" value={twitter} onChange={(e) => setTwitter(e.target.value)}
                className="w-full border-3 border-black rounded-lg px-4 py-3 text-[16px] font-medium focus:outline-none focus:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-shadow"
                placeholder="@usuario o URL" />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-bold mb-2">
                <AtSign className="w-4 h-4" /> Instagram
              </label>
              <input type="text" value={instagram} onChange={(e) => setInstagram(e.target.value)}
                className="w-full border-3 border-black rounded-lg px-4 py-3 text-[16px] font-medium focus:outline-none focus:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-shadow"
                placeholder="@usuario o URL" />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-bold mb-2">
                <Globe className="w-4 h-4" /> Sitio Web
              </label>
              <input type="text" value={website} onChange={(e) => setWebsite(e.target.value)}
                className="w-full border-3 border-black rounded-lg px-4 py-3 text-[16px] font-medium focus:outline-none focus:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-shadow"
                placeholder="https://misitio.com" />
            </div>
          </div>

          {/* Portfolio Card */}
          <div className="bg-white border-4 border-black rounded-xl p-6 md:p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Portafolio</h2>
              <span className="text-xs font-bold text-[#393939]">{portfolio.length} archivo{portfolio.length !== 1 ? "s" : ""}</span>
            </div>

            {portfolio.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {portfolio.map((item, i) => (
                  <div key={i} className="relative group border-3 border-black rounded-lg overflow-hidden shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    {item.file_type?.startsWith("image/") ? (
                      <a href={item.file_url || item.url} target="_blank" rel="noopener noreferrer">
                        <img src={item.file_url || item.url} alt={item.title} className="w-full h-28 object-cover" />
                      </a>
                    ) : (
                      <a href={item.file_url || item.url} target="_blank" rel="noopener noreferrer"
                        className="w-full h-28 bg-[#F5F5F5] flex flex-col items-center justify-center gap-1">
                        <FileText className="w-8 h-8 text-[#393939]" />
                        <span className="text-[10px] font-bold text-[#393939] px-2 truncate max-w-full">{item.title}</span>
                      </a>
                    )}
                    <button onClick={() => removePortfolioItem(i)}
                      className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity border border-black">
                      <Trash2 className="w-3 h-3" />
                    </button>
                    <div className="px-2 py-1.5 bg-white">
                      <p className="text-[10px] font-bold truncate">{item.title}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <label className={`flex items-center justify-center gap-2 w-full py-4 border-3 border-dashed rounded-xl cursor-pointer transition-all ${
              portfolioUploading ? "border-[#9945FF] bg-purple-50" : "border-black/30 hover:border-black hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
            }`}>
              {portfolioUploading ? (
                <><Loader2 className="w-5 h-5 animate-spin text-[#9945FF]" /><span className="text-sm font-bold text-[#9945FF]">Subiendo...</span></>
              ) : (
                <><Plus className="w-5 h-5" /><span className="text-sm font-bold">Agregar archivo (máx 30MB)</span></>
              )}
              <input type="file" accept="image/*,.pdf,.mp4" onChange={handlePortfolioUpload} className="hidden" disabled={portfolioUploading} />
            </label>
            <p className="text-[10px] text-[#393939] text-center">Imágenes, PDF y MP4 · Máximo 30MB por archivo</p>
          </div>

          {/* Save Button */}
          <button onClick={handleSave} disabled={saving}
            className="w-full bg-black text-white border-4 border-black rounded-xl py-4 font-bold text-lg flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-40">
            {saving ? (
              <span className="inline-flex items-center gap-2"><span className="h-5 w-5 animate-spin rounded-full border-3 border-white border-t-transparent" /> Guardando...</span>
            ) : (<><Save className="w-5 h-5" /> Guardar cambios</>)}
          </button>
        </div>
      </div>
    </>
  );
}
