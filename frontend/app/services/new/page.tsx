"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet, useAnchorWallet } from "@solana/wallet-adapter-react";
import { getProgram, findProfilePDA, findServicePDA } from "@/lib/anchor";
import { CATEGORIES } from "@/lib/constants";
import { formatUSDC } from "@/lib/utils";
import ServiceCard from "@/components/ServiceCard";
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

      toast.success("¡Servicio creado exitosamente!");
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
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-lg text-gray-500">
          Conecta tu wallet para crear un servicio.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-2 text-3xl font-extrabold dark:text-white">
        Publicar Nuevo Servicio
      </h1>
      <p className="mb-8 text-gray-500 dark:text-gray-400">
        Crea un servicio y empieza a recibir órdenes en USDC.
      </p>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-1 block text-sm font-semibold dark:text-gray-200">
              Título <span className="text-ve-red">*</span>
            </label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              maxLength={100}
              placeholder="Ej: Diseño de logo profesional"
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold dark:text-gray-200">
              Descripción <span className="text-ve-red">*</span>
            </label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              maxLength={500}
              rows={4}
              placeholder="Describe tu servicio en detalle..."
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              required
            />
            <p className="mt-1 text-xs text-gray-400">
              {descripcion.length}/500
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-semibold dark:text-gray-200">
                Precio (USDC) <span className="text-ve-red">*</span>
              </label>
              <input
                type="number"
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
                min="1"
                step="0.01"
                placeholder="5.00"
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold dark:text-gray-200">
                Días de entrega <span className="text-ve-red">*</span>
              </label>
              <input
                type="number"
                value={deliveryDays}
                onChange={(e) => setDeliveryDays(e.target.value)}
                min="1"
                max="30"
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold dark:text-gray-200">
              Categoría
            </label>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={loading || !titulo.trim() || precioNum < 1}
            className="w-full rounded-xl bg-ve-blue py-3 font-bold text-white shadow-lg transition hover:bg-ve-blue/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Creando...
              </span>
            ) : (
              `Publicar por ${formatUSDC(precioMicro)}`
            )}
          </button>
        </form>

        {/* Live preview */}
        <div>
          <h3 className="mb-3 text-sm font-semibold text-gray-500 dark:text-gray-400">
            Vista previa
          </h3>
          <ServiceCard service={previewService} />
        </div>
      </div>
    </div>
  );
}
