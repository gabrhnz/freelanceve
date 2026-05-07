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
import USDCBadge from "@/components/USDCBadge";
import ProfileCard from "@/components/ProfileCard";
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

      toast.success("¡Orden creada! USDC depositado en escrow.");
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
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-ve-blue border-t-transparent" />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-lg text-gray-500">Servicio no encontrado.</p>
      </div>
    );
  }

  const isOwner =
    publicKey && service.freelancer.toBase58() === publicKey.toBase58();

  return (
    <div className="mx-auto max-w-4xl">
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Service info */}
        <div className="space-y-6 lg:col-span-2">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  service.activo
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                }`}
              >
                {service.activo ? "Activo" : "Pausado"}
              </span>
              <span className="rounded-full bg-ve-blue/10 px-3 py-1 text-xs font-medium text-ve-blue dark:text-ve-yellow">
                {service.categoria}
              </span>
            </div>
            <h1 className="text-3xl font-extrabold dark:text-white">
              {service.titulo}
            </h1>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
            <h3 className="mb-2 text-sm font-semibold text-gray-500 dark:text-gray-400">
              Descripción
            </h3>
            <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
              {service.descripcion}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-xl border border-gray-200 bg-white p-4 text-center dark:border-gray-800 dark:bg-gray-900">
              <p className="text-xs text-gray-500 dark:text-gray-400">Precio</p>
              <USDCBadge amount={service.precioUsdc.toNumber()} />
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 text-center dark:border-gray-800 dark:bg-gray-900">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Entrega
              </p>
              <p className="mt-1 text-lg font-bold dark:text-white">
                {service.deliveryDays} días
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 text-center dark:border-gray-800 dark:bg-gray-900">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Órdenes
              </p>
              <p className="mt-1 text-lg font-bold dark:text-white">
                {service.ordersCount}
              </p>
            </div>
          </div>

          {/* Order button */}
          {!isOwner && service.activo && (
            <button
              onClick={handleOrder}
              disabled={ordering || !publicKey}
              className="w-full rounded-xl bg-ve-red py-3.5 text-lg font-bold text-white shadow-lg transition hover:bg-ve-red/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {ordering ? (
                <span className="inline-flex items-center gap-2">
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Procesando...
                </span>
              ) : (
                `Contratar por ${formatUSDC(service.precioUsdc.toNumber())}`
              )}
            </button>
          )}
          {isOwner && (
            <div className="rounded-lg bg-ve-yellow/10 p-4 text-center text-sm text-ve-blue dark:text-ve-yellow">
              Este es tu servicio. No puedes contratarte a ti mismo.
            </div>
          )}
        </div>

        {/* Freelancer profile sidebar */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400">
            Freelancer
          </h3>
          {freelancerProfile && (
            <ProfileCard profile={freelancerProfile} />
          )}
          <Link
            href={`/profile/${service.freelancer.toBase58()}`}
            className="block text-center text-sm font-medium text-ve-blue hover:underline dark:text-ve-yellow"
          >
            Ver perfil completo →
          </Link>
        </div>
      </div>
    </div>
  );
}
