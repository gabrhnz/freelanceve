"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { PublicKey } from "@solana/web3.js";
import { getReadonlyProgram, findProfilePDA } from "@/lib/anchor";
import { formatUSDC } from "@/lib/utils";
import ServiceCard from "@/components/ServiceCard";
import USDCBadge from "@/components/USDCBadge";

interface ProfileData {
  owner: PublicKey;
  nombre: string;
  bio: string;
  categoria: string;
  skills: string[];
  jobsCompleted: number;
  totalEarned: { toNumber: () => number };
  rating: number;
  serviceCount: number;
  createdAt: { toNumber: () => number };
}

interface ServiceAccount {
  publicKey: PublicKey;
  account: {
    freelancer: PublicKey;
    titulo: string;
    descripcion: string;
    precioUsdc: { toNumber: () => number };
    deliveryDays: number;
    categoria: string;
    activo: boolean;
    ordersCount: number;
  };
}

export default function ProfilePage() {
  const params = useParams();
  const walletAddress = params.wallet as string;

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [services, setServices] = useState<ServiceAccount[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    try {
      const program = getReadonlyProgram();
      const walletKey = new PublicKey(walletAddress);
      const [profilePDA] = findProfilePDA(walletKey);
      const data = await program.account.freelancerProfile.fetch(profilePDA);
      setProfile(data as unknown as ProfileData);

      const allServices = await program.account.serviceListing.all();
      const myServices = allServices.filter(
        (s) =>
          (s.account.freelancer as PublicKey).toBase58() === walletAddress &&
          s.account.activo
      ) as unknown as ServiceAccount[];
      setServices(myServices);
    } catch (err) {
      console.error("Error fetching profile:", err);
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-ve-blue border-t-transparent" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold dark:text-white">
            Perfil no encontrado
          </h2>
          <p className="mt-2 text-gray-500">
            Este wallet no tiene un perfil de freelancer registrado.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Profile header */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900 sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          {/* Avatar */}
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-ve-blue to-ve-red text-3xl font-bold text-white">
            {profile.nombre.charAt(0).toUpperCase()}
          </div>

          <div className="flex-1">
            <h1 className="text-2xl font-extrabold dark:text-white">
              {profile.nombre}
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}
            </p>
            <p className="mt-2 text-gray-700 dark:text-gray-300">
              {profile.bio}
            </p>

            {/* Skills */}
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full bg-ve-blue/10 px-3 py-1 text-xs font-medium text-ve-blue dark:text-ve-yellow">
                {profile.categoria}
              </span>
              {profile.skills.map((s) => (
                <span
                  key={s}
                  className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-3 gap-4 border-t border-gray-200 pt-6 dark:border-gray-800">
          <div className="text-center">
            <p className="text-2xl font-bold text-ve-blue dark:text-ve-yellow">
              {profile.jobsCompleted}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Trabajos
            </p>
          </div>
          <div className="text-center">
            <USDCBadge amount={profile.totalEarned.toNumber()} />
            <p className="text-xs text-gray-500 dark:text-gray-400">Ganado</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold dark:text-white">
              {profile.rating || "—"}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Rating</p>
          </div>
        </div>
      </div>

      {/* Services */}
      <section>
        <h2 className="mb-4 text-xl font-bold dark:text-white">
          Servicios Activos ({services.length})
        </h2>
        {services.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">
            Este freelancer no tiene servicios activos.
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {services.map((s) => (
              <ServiceCard
                key={s.publicKey.toBase58()}
                service={s.account}
                publicKey={s.publicKey}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
