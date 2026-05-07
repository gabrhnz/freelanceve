"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useWallet, useAnchorWallet } from "@solana/wallet-adapter-react";
import { getProgram, findProfilePDA } from "@/lib/anchor";
import { formatUSDC } from "@/lib/utils";
import { useServices } from "@/hooks/useServices";
import { useOrders } from "@/hooks/useOrders";
import OrderCard from "@/components/OrderCard";
import toast from "react-hot-toast";

interface ProfileData {
  nombre: string;
  bio: string;
  categoria: string;
  skills: string[];
  jobsCompleted: number;
  totalEarned: { toNumber: () => number };
  rating: number;
  serviceCount: number;
}

export default function DashboardPage() {
  const { publicKey } = useWallet();
  const wallet = useAnchorWallet();
  const router = useRouter();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const { services, loading: loadingServices, refetch: refetchServices } = useServices();
  const { freelancerOrders, loading: loadingOrders } = useOrders();

  const myServices = services.filter(
    (s) => publicKey && s.account.freelancer.toBase58() === publicKey.toBase58()
  );

  const fetchProfile = useCallback(async () => {
    if (!publicKey || !wallet) return;
    try {
      const program = getProgram(wallet);
      const [profilePDA] = findProfilePDA(publicKey);
      const data = await program.account.freelancerProfile.fetch(profilePDA);
      setProfile(data as unknown as ProfileData);
    } catch {
      router.push("/register");
    } finally {
      setLoadingProfile(false);
    }
  }, [publicKey, wallet, router]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleToggle = async (serviceKey: string, currentActive: boolean) => {
    if (!wallet || !publicKey) return;
    try {
      const program = getProgram(wallet);
      await program.methods
        .toggleService(!currentActive)
        .accounts({
          service: serviceKey,
          owner: publicKey,
        })
        .rpc();
      toast.success(currentActive ? "Servicio pausado" : "Servicio activado");
      refetchServices();
    } catch (err: unknown) {
      console.error(err);
      toast.error("Error al cambiar estado del servicio");
    }
  };

  if (!publicKey) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-lg text-gray-500">Conecta tu wallet para ver tu dashboard.</p>
      </div>
    );
  }

  if (loadingProfile) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-ve-blue border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold dark:text-white">
            Hola, {profile?.nombre}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">{profile?.bio}</p>
        </div>
        <Link
          href="/services/new"
          className="inline-flex items-center justify-center rounded-xl bg-ve-blue px-6 py-2.5 font-bold text-white shadow transition hover:bg-ve-blue/90"
        >
          + Publicar Servicio
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Ganado</p>
          <p className="mt-1 text-2xl font-bold text-ve-blue dark:text-ve-yellow">
            {formatUSDC(profile?.totalEarned?.toNumber() || 0)}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-sm text-gray-500 dark:text-gray-400">Trabajos Completados</p>
          <p className="mt-1 text-2xl font-bold dark:text-white">
            {profile?.jobsCompleted || 0}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-sm text-gray-500 dark:text-gray-400">Rating</p>
          <p className="mt-1 text-2xl font-bold dark:text-white">
            {profile?.rating || "—"}
          </p>
        </div>
      </div>

      {/* My Services */}
      <section>
        <h2 className="mb-4 text-xl font-bold dark:text-white">Mis Servicios</h2>
        {loadingServices ? (
          <div className="py-8 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-ve-blue border-t-transparent" />
          </div>
        ) : myServices.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">
            No tienes servicios publicados aún.
          </p>
        ) : (
          <div className="space-y-3">
            {myServices.map((s) => (
              <div
                key={s.publicKey.toBase58()}
                className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
              >
                <div>
                  <Link
                    href={`/services/${s.publicKey.toBase58()}`}
                    className="font-semibold text-ve-blue hover:underline dark:text-ve-yellow"
                  >
                    {s.account.titulo}
                  </Link>
                  <p className="text-sm text-gray-500">
                    {formatUSDC(s.account.precioUsdc.toNumber())} · {s.account.deliveryDays} días
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      s.account.activo
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                    }`}
                  >
                    {s.account.activo ? "Activo" : "Pausado"}
                  </span>
                  <button
                    onClick={() =>
                      handleToggle(s.publicKey.toBase58(), s.account.activo)
                    }
                    className="rounded-lg border border-gray-300 px-3 py-1 text-xs font-medium transition hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
                  >
                    {s.account.activo ? "Pausar" : "Activar"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Recent Orders */}
      <section>
        <h2 className="mb-4 text-xl font-bold dark:text-white">
          Órdenes Recientes (Freelancer)
        </h2>
        {loadingOrders ? (
          <div className="py-8 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-ve-blue border-t-transparent" />
          </div>
        ) : freelancerOrders.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">
            No tienes órdenes recibidas aún.
          </p>
        ) : (
          <div className="space-y-3">
            {freelancerOrders.slice(0, 5).map((o) => (
              <OrderCard
                key={o.publicKey.toBase58()}
                order={o.account}
                orderKey={o.publicKey}
                role="freelancer"
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
