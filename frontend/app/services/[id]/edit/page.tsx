"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { CATEGORIES } from "@/lib/constants";
import { Navigation } from "@/components/navigation";
import { getServiceById, updateService, Service } from "@/lib/supabase";
import { Eye, Clock, Save, Sparkles, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

export default function EditServicePage() {
  const params = useParams();
  const serviceId = params.id as string;
  const router = useRouter();

  const [service, setService] = useState<Service | null>(null);
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [precio, setPrecio] = useState("");
  const [deliveryDays, setDeliveryDays] = useState("7");
  const [categoria, setCategoria] = useState<string>(CATEGORIES[0]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [enhancing, setEnhancing] = useState(false);
  const precioNum = parseFloat(precio) || 0;

  const handleEnhance = async () => {
    if (!titulo.trim() && !descripcion.trim()) {
      toast.error("Escribe al menos un título o descripción");
      return;
    }
    setEnhancing(true);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "enhance", titulo: titulo.trim(), descripcion: descripcion.trim(), categoria }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (data.titulo) setTitulo(data.titulo);
      if (data.descripcion) setDescripcion(data.descripcion);
      toast.success("¡Mejorado con IA!");
    } catch {
      toast.error("Error al mejorar con IA");
    } finally {
      setEnhancing(false);
    }
  };

  const fetchService = useCallback(async () => {
    const s = await getServiceById(serviceId);
    if (!s) {
      toast.error("Servicio no encontrado");
      router.push("/dashboard");
      return;
    }
    setService(s);
    setTitulo(s.titulo);
    setDescripcion(s.descripcion);
    setPrecio(String(s.precio_usdc));
    setDeliveryDays(String(s.delivery_days));
    setCategoria(s.categoria);
    setFetching(false);
  }, [serviceId, router]);

  useEffect(() => {
    fetchService();
  }, [fetchService]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      const updated = await updateService(serviceId, {
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        precio_usdc: precioNum,
        delivery_days: days,
        categoria,
      });

      if (updated) {
        toast.success("¡Servicio actualizado!");
        router.push("/dashboard");
      } else {
        toast.error("Error al actualizar servicio");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error al actualizar servicio");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <>
        <Navigation />
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-black border-t-transparent" />
        </div>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <h1 className="text-[32px] md:text-[42px] font-bold leading-tight mb-2">
          Editar <span className="bg-ve-yellow px-2">Servicio</span>
        </h1>
        <p className="text-[#393939] text-[16px] font-medium mb-8">
          Modifica los detalles de tu servicio.
        </p>

        <div className="grid gap-8 lg:grid-cols-2">
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
                  className="w-full border-3 border-black rounded-lg px-4 py-3 text-[16px] font-medium placeholder:text-gray-400 focus:outline-none focus:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-shadow resize-none"
                  required
                />
                <div className="mt-1 flex items-center justify-between">
                  <button type="button" onClick={handleEnhance} disabled={enhancing || (!titulo.trim() && !descripcion.trim())}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#9945FF] hover:text-[#7B2FD4] disabled:opacity-40 transition-colors">
                    {enhancing ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Mejorando...</> : <><Sparkles className="w-3.5 h-3.5" /> Mejorar con IA</>}
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
                    className="w-full border-3 border-black rounded-lg px-4 py-3 text-[16px] font-medium focus:outline-none focus:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-shadow"
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
                    className="w-full border-3 border-black rounded-lg px-4 py-3 text-[16px] font-medium focus:outline-none focus:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-shadow"
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
            </div>

            <button
              type="submit"
              disabled={loading || !titulo.trim() || precioNum < 1}
              className="w-full bg-black text-white border-4 border-black rounded-xl py-4 font-bold text-lg flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="h-5 w-5 animate-spin rounded-full border-3 border-white border-t-transparent" />
                  Guardando...
                </span>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Guardar cambios
                </>
              )}
            </button>
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
              </div>
              <h3 className="mb-1 text-lg font-bold">
                {titulo || "Título del servicio"}
              </h3>
              <p className="mb-3 line-clamp-2 text-sm text-[#393939] font-medium">
                {descripcion || "Descripción del servicio..."}
              </p>
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
