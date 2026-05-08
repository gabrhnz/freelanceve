"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { PublicKey } from "@solana/web3.js";
import { useWallet, useAnchorWallet } from "@solana/wallet-adapter-react";
import {
  getProgram,
  getReadonlyProgram,
  findProfilePDA,
  findOrderPDA,
  findEscrowAuthorityPDA,
  findEscrowTokenPDA,
} from "@/lib/anchor";
import { USDC_MINT_DEVNET } from "@/lib/constants";
import { formatUSDC, shortWallet } from "@/lib/utils";
import { Navigation } from "@/components/navigation";
import ProfileCard from "@/components/ProfileCard";
import { Clock, ShoppingCart, Package, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import {
  getAssociatedTokenAddress,
} from "@solana/spl-token";

interface ServiceData {
  freelancer: PublicKey;
  titulo: string;
  descripcion: string;
  precioUsdc: { toNumber: () => number };
  deliveryDays: number;
  categoria: string;
  activo: boolean;
  ordersCount: number;
  createdAt: { toNumber: () => number };
}

interface ProfileData {
  owner: PublicKey;
  nombre: string;
  bio: string;
  categoria: string;
  skills: string[];
  jobsCompleted: number;
  totalEarned: { toNumber: () => number };
  rating: number;
}

export default function ServiceDetailPage() {
  const params = useParams();
  const serviceId = params.id as string;
  const { publicKey } = useWallet();
  const wallet = useAnchorWallet();

  const [service, setService] = useState<ServiceData | null>(null);
  const [freelancerProfile, setFreelancerProfile] =
    useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState(false);

  const fetchService = useCallback(async () => {
    try {
      const program = getReadonlyProgram();
      const serviceKey = new PublicKey(serviceId);
      const data = await program.account.serviceListing.fetch(serviceKey);
      setService(data as unknown as ServiceData);

      const [profilePDA] = findProfilePDA(data.freelancer as PublicKey);
      const profileData =
        await program.account.freelancerProfile.fetch(profilePDA);
      setFreelancerProfile(profileData as unknown as ProfileData);
    } catch (err) {
      console.error("Error fetching service:", err);
      toast.error("No se pudo cargar el servicio");
    } finally {
      setLoading(false);
    }
  }, [serviceId]);

  useEffect(() => {
    fetchService();
  }, [fetchService]);

  const handleOrder = async () => {
    if (!wallet || !publicKey || !service) {
      toast.error("Conecta tu wallet primero");
      return;
    }

    setOrdering(true);
    try {
      const program = getProgram(wallet);
      const serviceKey = new PublicKey(serviceId);

      const [orderPDA] = findOrderPDA(serviceKey, service.ordersCount);
      const [escrowAuthority] = findEscrowAuthorityPDA(orderPDA);
      const [escrowToken] = findEscrowTokenPDA(orderPDA);

      const clientUsdc = await getAssociatedTokenAddress(
        USDC_MINT_DEVNET,
        publicKey
      );

      await program.methods
        .placeOrder()
        .accounts({
          order: orderPDA,
          service: serviceKey,
          client: publicKey,
          clientUsdc: clientUsdc,
          escrowUsdc: escrowToken,
          escrowAuthority: escrowAuthority,
          usdcMint: USDC_MINT_DEVNET,
          tokenProgram: new PublicKey(
            "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
          ),
          systemProgram: new PublicKey("11111111111111111111111111111111"),
          rent: new PublicKey("SysvarRent111111111111111111111111111111111"),
        })
        .rpc();

      toast.success("Orden creada! USDC depositado en escrow.");
      fetchService();
    } catch (err: unknown) {
      console.error(err);
      toast.error(
        err instanceof Error ? err.message : "Error al crear la orden"
      );
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
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-xl font-bold mb-2">Servicio no encontrado</p>
          </div>
        </div>
      </>
    );
  }

  const isOwner =
    publicKey && service.freelancer.toBase58() === publicKey.toBase58();

  return (
    <>
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Service info */}
          <div className="space-y-6 lg:col-span-2">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <span
                  className={`rounded-lg px-3 py-1 text-xs font-bold border-2 border-black ${
                    service.activo
                      ? "bg-ve-yellow text-black"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {service.activo ? "Activo" : "Pausado"}
                </span>
                <span className="bg-ve-blue text-white border-2 border-black rounded-lg px-3 py-1 text-xs font-bold">
                  {service.categoria}
                </span>
              </div>
              <h1 className="text-[32px] md:text-[42px] font-bold leading-tight">
                {service.titulo}
              </h1>
            </div>

            <div className="bg-white border-4 border-black rounded-xl p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <h3 className="text-sm font-bold text-[#393939] mb-3">Descripción</h3>
              <p className="whitespace-pre-wrap text-[#393939] text-[16px] font-medium leading-relaxed">
                {service.descripcion}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white border-4 border-black rounded-xl p-4 text-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                <div className="w-8 h-8 mx-auto mb-2 bg-[#2775CA] rounded-lg flex items-center justify-center border-2 border-black">
                  <svg viewBox="0 0 128 128" className="w-5 h-5">
                    <circle cx="64" cy="64" r="60" fill="white"/>
                    <text x="64" y="82" textAnchor="middle" fill="#2775CA" fontSize="60" fontWeight="bold">$</text>
                  </svg>
                </div>
                <p className="text-[20px] font-bold">{formatUSDC(service.precioUsdc.toNumber())}</p>
                <p className="text-xs text-[#393939] font-medium">Precio</p>
              </div>
              <div className="bg-white border-4 border-black rounded-xl p-4 text-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                <div className="w-8 h-8 mx-auto mb-2 bg-ve-yellow rounded-lg flex items-center justify-center border-2 border-black">
                  <Clock className="w-4 h-4" />
                </div>
                <p className="text-[20px] font-bold">{service.deliveryDays}</p>
                <p className="text-xs text-[#393939] font-medium">Días entrega</p>
              </div>
              <div className="bg-white border-4 border-black rounded-xl p-4 text-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                <div className="w-8 h-8 mx-auto mb-2 bg-[#9945FF] rounded-lg flex items-center justify-center border-2 border-black">
                  <Package className="w-4 h-4 text-white" />
                </div>
                <p className="text-[20px] font-bold">{service.ordersCount}</p>
                <p className="text-xs text-[#393939] font-medium">Órdenes</p>
              </div>
            </div>

            {/* Order button */}
            {!isOwner && service.activo && (
              <button
                onClick={handleOrder}
                disabled={ordering || !publicKey}
                className="w-full bg-ve-red text-white border-4 border-black rounded-xl py-4 font-bold text-lg flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
              >
                {ordering ? (
                  <>
                    <span className="h-5 w-5 animate-spin rounded-full border-3 border-white border-t-transparent" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-5 h-5" />
                    Contratar por {formatUSDC(service.precioUsdc.toNumber())}
                  </>
                )}
              </button>
            )}
            {isOwner && (
              <div className="bg-ve-yellow border-4 border-black rounded-xl p-4 text-center font-bold shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                Este es tu servicio. No puedes contratarte a ti mismo.
              </div>
            )}
          </div>

          {/* Freelancer profile sidebar */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-[#393939]">Freelancer</h3>
            {freelancerProfile && (
              <ProfileCard profile={freelancerProfile} />
            )}
            <Link
              href={`/profile/${service.freelancer.toBase58()}`}
              className="block text-center bg-white border-3 border-black rounded-xl py-3 font-bold text-sm hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-shadow"
            >
              Ver perfil completo →
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
