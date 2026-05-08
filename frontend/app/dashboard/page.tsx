"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useWallet, useAnchorWallet } from "@solana/wallet-adapter-react";
import { Connection, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import { getProgram, findProfilePDA } from "@/lib/anchor";
import { RPC_URL, USDC_MINT_DEVNET } from "@/lib/constants";
import { formatUSDC } from "@/lib/utils";
import { useServices } from "@/hooks/useServices";
import { useOrders } from "@/hooks/useOrders";
import { Navigation } from "@/components/navigation";
import OrderCard from "@/components/OrderCard";
import { Plus, Wallet, ArrowLeftRight, Briefcase, TrendingUp, Star, RefreshCw } from "lucide-react";
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
  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [usdcBalance, setUsdcBalance] = useState<number | null>(null);
  const [loadingBalances, setLoadingBalances] = useState(false);
  const [showSwap, setShowSwap] = useState(false);
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

  const fetchBalances = useCallback(async () => {
    if (!publicKey) return;
    setLoadingBalances(true);
    try {
      const connection = new Connection(RPC_URL, "confirmed");
      const sol = await connection.getBalance(publicKey);
      setSolBalance(sol / LAMPORTS_PER_SOL);

      try {
        const usdcAta = await getAssociatedTokenAddress(USDC_MINT_DEVNET, publicKey);
        const usdcAccount = await connection.getTokenAccountBalance(usdcAta);
        setUsdcBalance(Number(usdcAccount.value.uiAmount));
      } catch {
        setUsdcBalance(0);
      }
    } catch (err) {
      console.error("Error fetching balances:", err);
    } finally {
      setLoadingBalances(false);
    }
  }, [publicKey]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

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
      <>
        <Navigation />
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="bg-white border-4 border-black rounded-xl p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-center max-w-md mx-4">
            <Wallet className="w-12 h-12 mx-auto mb-4" />
            <p className="text-xl font-bold mb-2">Conecta tu wallet</p>
            <p className="text-[#393939]">Para acceder a tu dashboard necesitas conectar tu wallet de Solana.</p>
          </div>
        </div>
      </>
    );
  }

  if (loadingProfile) {
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
      <div className="container mx-auto px-4 py-8 max-w-6xl space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-[32px] md:text-[42px] font-bold leading-tight">
              Hola, <span className="bg-ve-yellow px-2">{profile?.nombre}</span>
            </h1>
            <p className="text-[#393939] text-[16px] font-medium mt-1">{profile?.bio}</p>
          </div>
          <Link
            href="/services/new"
            className="inline-flex items-center justify-center gap-2 bg-black text-white border-4 border-black rounded-xl px-6 py-3 font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all"
          >
            <Plus className="w-5 h-5" /> Publicar Servicio
          </Link>
        </div>

        {/* Wallet Balances */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white border-4 border-black rounded-xl p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-[#393939]">SOL Balance</p>
              <div className="w-8 h-8 bg-[#9945FF] rounded-lg flex items-center justify-center border-2 border-black">
                <svg viewBox="0 0 128 128" className="w-5 h-5">
                  <circle cx="64" cy="64" r="60" fill="white"/>
                  <text x="64" y="82" textAnchor="middle" fill="#9945FF" fontSize="60" fontWeight="bold">S</text>
                </svg>
              </div>
            </div>
            <p className="text-[28px] font-bold">
              {loadingBalances ? "..." : solBalance !== null ? solBalance.toFixed(4) : "—"}
            </p>
            <p className="text-xs text-[#393939] font-medium">SOL</p>
          </div>

          <div className="bg-white border-4 border-black rounded-xl p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-[#393939]">USDC Balance</p>
              <div className="w-8 h-8 bg-[#2775CA] rounded-lg flex items-center justify-center border-2 border-black">
                <svg viewBox="0 0 128 128" className="w-5 h-5">
                  <circle cx="64" cy="64" r="60" fill="white"/>
                  <text x="64" y="82" textAnchor="middle" fill="#2775CA" fontSize="60" fontWeight="bold">$</text>
                </svg>
              </div>
            </div>
            <p className="text-[28px] font-bold">
              {loadingBalances ? "..." : usdcBalance !== null ? `$${usdcBalance.toFixed(2)}` : "—"}
            </p>
            <p className="text-xs text-[#393939] font-medium">USDC</p>
          </div>

          <div className="bg-white border-4 border-black rounded-xl p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-[#393939]">Total Ganado</p>
              <div className="w-8 h-8 bg-ve-yellow rounded-lg flex items-center justify-center border-2 border-black">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <p className="text-[28px] font-bold">
              {formatUSDC(profile?.totalEarned?.toNumber() || 0)}
            </p>
            <p className="text-xs text-[#393939] font-medium">On-chain earnings</p>
          </div>

          <div className="bg-white border-4 border-black rounded-xl p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-[#393939]">Stats</p>
              <div className="w-8 h-8 bg-ve-red rounded-lg flex items-center justify-center border-2 border-black">
                <Star className="w-4 h-4 text-white" />
              </div>
            </div>
            <p className="text-[28px] font-bold">{profile?.jobsCompleted || 0}</p>
            <p className="text-xs text-[#393939] font-medium">
              Trabajos · Rating: {profile?.rating || "—"}
            </p>
          </div>
        </div>

        {/* Refresh balances */}
        <div className="flex justify-end">
          <button
            onClick={() => { fetchBalances(); }}
            disabled={loadingBalances}
            className="flex items-center gap-2 text-sm font-bold text-[#393939] hover:text-black transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loadingBalances ? "animate-spin" : ""}`} />
            Actualizar balances
          </button>
        </div>

        {/* Swap section */}
        <section>
          <button
            onClick={() => setShowSwap(!showSwap)}
            className="flex items-center gap-3 bg-[#9945FF] text-white border-4 border-black rounded-xl px-6 py-4 font-bold text-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all w-full justify-center"
          >
            <ArrowLeftRight className="w-6 h-6" />
            {showSwap ? "Ocultar Swap" : "Abrir Swap (Jupiter)"}
          </button>

          {showSwap && (
            <div className="mt-4 bg-white border-4 border-black rounded-xl overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <iframe
                src={`https://jup.ag/swap/SOL-USDC?referral=&inAmount=0.1`}
                width="100%"
                height="500"
                style={{ border: "none" }}
                title="Jupiter Swap"
              />
            </div>
          )}
        </section>

        {/* My Services */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[24px] font-bold">Mis Servicios</h2>
            <Link href="/services/new" className="text-sm font-bold text-[#393939] hover:text-black">
              Ver todos →
            </Link>
          </div>
          {loadingServices ? (
            <div className="py-8 text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-black border-t-transparent" />
            </div>
          ) : myServices.length === 0 ? (
            <div className="bg-[#F5F5F5] border-4 border-black/10 rounded-xl p-8 text-center">
              <Briefcase className="w-10 h-10 mx-auto mb-3 text-gray-400" />
              <p className="text-[#393939] font-medium">No tienes servicios publicados aún.</p>
              <Link
                href="/services/new"
                className="inline-flex items-center gap-2 mt-4 bg-black text-white border-3 border-black rounded-lg px-5 py-2.5 font-bold text-sm shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
              >
                <Plus className="w-4 h-4" /> Crear primer servicio
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {myServices.map((s) => (
                <div
                  key={s.publicKey.toBase58()}
                  className="flex items-center justify-between bg-white border-4 border-black rounded-xl p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
                >
                  <div>
                    <Link
                      href={`/services/${s.publicKey.toBase58()}`}
                      className="font-bold text-lg hover:underline"
                    >
                      {s.account.titulo}
                    </Link>
                    <p className="text-sm text-[#393939] font-medium">
                      {formatUSDC(s.account.precioUsdc.toNumber())} · {s.account.deliveryDays} días
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded-lg px-3 py-1 text-xs font-bold border-2 border-black ${
                        s.account.activo
                          ? "bg-ve-yellow text-black"
                          : "bg-gray-200 text-gray-500"
                      }`}
                    >
                      {s.account.activo ? "Activo" : "Pausado"}
                    </span>
                    <button
                      onClick={() =>
                        handleToggle(s.publicKey.toBase58(), s.account.activo)
                      }
                      className="bg-white border-3 border-black rounded-lg px-4 py-1.5 text-xs font-bold hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-shadow"
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
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[24px] font-bold">Órdenes Recientes</h2>
            <Link href="/orders" className="text-sm font-bold text-[#393939] hover:text-black">
              Ver todas →
            </Link>
          </div>
          {loadingOrders ? (
            <div className="py-8 text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-black border-t-transparent" />
            </div>
          ) : freelancerOrders.length === 0 ? (
            <div className="bg-[#F5F5F5] border-4 border-black/10 rounded-xl p-8 text-center">
              <p className="text-[#393939] font-medium">No tienes órdenes recibidas aún.</p>
            </div>
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
    </>
  );
}
