"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { PublicKey } from "@solana/web3.js";
import { getReadonlyProgram, findProfilePDA } from "@/lib/anchor";
import { formatUSDC } from "@/lib/utils";
import { Navigation } from "@/components/navigation";
import ServiceCard from "@/components/ServiceCard";
import { UserCircle, Briefcase, TrendingUp, Star } from "lucide-react";

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
      <>
        <Navigation />
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-black border-t-transparent" />
        </div>
      </>
    );
  }

  if (!profile) {
    return (
      <>
        <Navigation />
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="bg-white border-4 border-black rounded-xl p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-center max-w-md mx-4">
            <UserCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-xl font-bold mb-2">Perfil no encontrado</p>
            <p className="text-[#393939]">Este wallet no tiene un perfil registrado.</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-4xl space-y-8">
        {/* Profile header */}
        <div className="bg-white border-4 border-black rounded-xl p-6 sm:p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            {/* Avatar */}
            <div className="w-20 h-20 shrink-0 bg-[#9945FF] rounded-xl border-4 border-black flex items-center justify-center text-3xl font-bold text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              {profile.nombre.charAt(0).toUpperCase()}
            </div>

            <div className="flex-1">
              <h1 className="text-[28px] md:text-[36px] font-bold leading-tight">
                {profile.nombre}
              </h1>
              <p className="text-sm font-mono text-[#393939] mt-1">
                {walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}
              </p>
              <p className="mt-3 text-[#393939] text-[16px] font-medium">
                {profile.bio}
              </p>

              {/* Skills */}
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="bg-ve-blue text-white border-2 border-black rounded-lg px-3 py-1 text-xs font-bold">
                  {profile.categoria}
                </span>
                {profile.skills.map((s) => (
                  <span
                    key={s}
                    className="bg-ve-yellow border-2 border-black rounded-lg px-3 py-1 text-xs font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-6 grid grid-cols-3 gap-4 border-t-4 border-black/10 pt-6">
            <div className="text-center bg-[#F5F5F5] rounded-xl p-4 border-2 border-black/10">
              <div className="w-8 h-8 mx-auto mb-2 bg-ve-yellow rounded-lg flex items-center justify-center border-2 border-black">
                <Briefcase className="w-4 h-4" />
              </div>
              <p className="text-[24px] font-bold">{profile.jobsCompleted}</p>
              <p className="text-xs text-[#393939] font-medium">Trabajos</p>
            </div>
            <div className="text-center bg-[#F5F5F5] rounded-xl p-4 border-2 border-black/10">
              <div className="w-8 h-8 mx-auto mb-2 bg-[#2775CA] rounded-lg flex items-center justify-center border-2 border-black">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              <p className="text-[24px] font-bold">{formatUSDC(profile.totalEarned.toNumber())}</p>
              <p className="text-xs text-[#393939] font-medium">Ganado</p>
            </div>
            <div className="text-center bg-[#F5F5F5] rounded-xl p-4 border-2 border-black/10">
              <div className="w-8 h-8 mx-auto mb-2 bg-ve-red rounded-lg flex items-center justify-center border-2 border-black">
                <Star className="w-4 h-4 text-white" />
              </div>
              <p className="text-[24px] font-bold">{profile.rating || "—"}</p>
              <p className="text-xs text-[#393939] font-medium">Rating</p>
            </div>
          </div>
        </div>

        {/* Services */}
        <section>
          <h2 className="text-[24px] font-bold mb-4">
            Servicios Activos ({services.length})
          </h2>
          {services.length === 0 ? (
            <div className="bg-[#F5F5F5] border-4 border-black/10 rounded-xl p-8 text-center">
              <Briefcase className="w-10 h-10 mx-auto mb-3 text-gray-400" />
              <p className="text-[#393939] font-medium">
                Este freelancer no tiene servicios activos.
              </p>
            </div>
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
    </>
  );
}
