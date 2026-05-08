"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet, useAnchorWallet } from "@solana/wallet-adapter-react";
import { getProgram, findProfilePDA, findServicePDA } from "@/lib/anchor";
import { CATEGORIES } from "@/lib/constants";
import { formatUSDC } from "@/lib/utils";
import { Navigation } from "@/components/navigation";
import ServiceCard from "@/components/ServiceCard";
import { Wallet, Eye } from "lucide-react";
import toast from "react-hot-toast";
import { BN } from "@coral-xyz/anchor";

export default function NewServicePage() {
  const { publicKey } = useWallet();
  const wallet = useAnchorWallet();
  const router = useRouter();

  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [precio, setPrecio] = useState("");
  const [deliveryDays, setDeliveryDays] = useState("7");
  const [categoria, setCategoria] = useState<string>(CATEGORIES[0]);
  const [loading, setLoading] = useState(false);

  const precioNum = parseFloat(precio) || 0;
  const precioMicro = Math.round(precioNum * 1_000_000);

  const previewService = {
    titulo: titulo || "Título del servicio",
    descripcion: descripcion || "Descripción del servicio...",
    precioUsdc: { toNumber: () => precioMicro },
    deliveryDays: parseInt(deliveryDays) || 7,
    categoria,
    activo: true,
    freelancer: publicKey,
    ordersCount: 0,
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wallet || !publicKey) {
      toast.error("Conecta tu wallet primero");
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
      const program = getProgram(wallet);
      const [profilePDA] = findProfilePDA(publicKey);
      const profile = await program.account.freelancerProfile.fetch(profilePDA);
      const serviceCount = (profile as unknown as { serviceCount: number }).serviceCount;
      const [servicePDA] = findServicePDA(publicKey, serviceCount);

      await program.methods
        .createService(titulo, descripcion, new BN(precioMicro), days, categoria)
        .accounts({
          service: servicePDA,
          profile: profilePDA,
          owner: publicKey,
        })
        .rpc();

      toast.success("Servicio creado exitosamente!");
      router.push("/dashboard");
    } catch (err: unknown) {
      console.error(err);
      toast.error(
        err instanceof Error ? err.message : "Error al crear servicio"
      );
    } finally {
      setLoading(false);
    }
  };

  if (!publicKey) {
    return (
      <>
        <Navigation />
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="bg-white border-4 border-black rounded-xl p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-center max-w-md mx-4">
            <Wallet className="w-12 h-12 mx-auto mb-4" />
            <p className="text-xl font-bold mb-2">Conecta tu wallet</p>
            <p className="text-[#393939]">Para crear un servicio necesitas conectar tu wallet.</p>
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
                <p className="mt-1 text-xs text-gray-400 text-right">{descripcion.length}/500</p>
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
            </div>

            <button
              type="submit"
              disabled={loading || !titulo.trim() || precioNum < 1}
              className="w-full bg-[#9945FF] text-white border-4 border-black rounded-xl py-4 font-bold text-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="h-5 w-5 animate-spin rounded-full border-3 border-white border-t-transparent" />
                  Creando...
                </span>
              ) : (
                `Publicar por ${formatUSDC(precioMicro)}`
              )}
            </button>
          </form>

          {/* Live preview */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Eye className="w-4 h-4 text-[#393939]" />
              <h3 className="text-sm font-bold text-[#393939]">Vista previa</h3>
            </div>
            <ServiceCard service={previewService} />
          </div>
        </div>
      </div>
    </>
  );
}
