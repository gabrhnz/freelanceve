"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import { RPC_URL, USDC_MINT_DEVNET } from "@/lib/constants";
import { Navigation } from "@/components/navigation";
import { useSession } from "@/contexts/session-context";
import {
  Profile,
  Service as DbService,
  Order as DbOrder,
  getProfileByEmail,
  getProfileByWallet,
  getServicesByOwner,
  getOrdersByUser,
  updateService as updateDbService,
  deleteService as deleteDbService,
} from "@/lib/supabase";
import {
  Plus, Wallet, Briefcase, TrendingUp, Package,
  RefreshCw, Clock, CheckCircle, Eye, Pencil, Trash2, ShieldCheck, ArrowRightLeft,
} from "lucide-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import toast from "react-hot-toast";

export default function DashboardPage() {
  const { publicKey } = useWallet();
  const { user, loading: sessionLoading } = useSession();
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [services, setServices] = useState<DbService[]>([]);
  const [orders, setOrders] = useState<DbOrder[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingServices, setLoadingServices] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [usdcBalance, setUsdcBalance] = useState<number | null>(null);
  const [loadingBalances, setLoadingBalances] = useState(false);
  const [viewMode, setViewMode] = useState<"freelancer" | "client">("freelancer");

  const fetchProfile = useCallback(async () => {
    // Try email first, then wallet
    let p: Profile | null = null;
    if (user?.email) {
      p = await getProfileByEmail(user.email);
    }
    if (!p && publicKey) {
      p = await getProfileByWallet(publicKey.toBase58());
    }
    if (!p) {
      if (!sessionLoading) router.push("/register");
      setLoadingProfile(false);
      return;
    }
    setProfile(p);

    // Fetch services & orders
    setLoadingServices(true);
    setLoadingOrders(true);
    try {
      const [srvs, ords] = await Promise.all([
        getServicesByOwner(p.id),
        getOrdersByUser(p.id),
      ]);
      setServices(srvs);
      setOrders(ords);
    } catch (err) {
      console.error("Error fetching profile:", err);
    } finally {
      setLoadingProfile(false);
      setLoadingServices(false);
      setLoadingOrders(false);
    }
  }, [user?.email, publicKey, sessionLoading, router]);

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
    if (!sessionLoading || publicKey) fetchProfile();
  }, [sessionLoading, publicKey, fetchProfile]);

  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  const handleToggle = async (serviceId: string, currentActive: boolean) => {
    try {
      await updateDbService(serviceId, { activo: !currentActive });
      setServices((prev) =>
        prev.map((s) => (s.id === serviceId ? { ...s, activo: !currentActive } : s))
      );
      toast.success(currentActive ? "Servicio pausado" : "Servicio activado");
    } catch (err) {
      console.error(err);
      toast.error("Error al cambiar estado");
    }
  };

  const handleDelete = async (serviceId: string, titulo: string) => {
    if (!confirm(`¿Estás seguro de eliminar "${titulo}"? Esta acción no se puede deshacer.`)) return;
    try {
      const ok = await deleteDbService(serviceId);
      if (ok) {
        setServices((prev) => prev.filter((s) => s.id !== serviceId));
        toast.success("Servicio eliminado");
      } else {
        toast.error("Error al eliminar servicio");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error al eliminar servicio");
    }
  };

  const myOrders = orders.filter((o) => o.freelancer_id === profile?.id);
  const clientOrders = orders.filter((o) => o.client_id === profile?.id);
  const completedOrders = orders.filter((o) => o.status === "completed");

  // Auth guard
  if (sessionLoading) {
    return (
      <>
        <Navigation />
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-black border-t-transparent" />
        </div>
      </>
    );
  }

  if (!user && !publicKey) {
    return (
      <>
        <Navigation />
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="bg-white border-4 border-black rounded-xl p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-center max-w-md mx-4">
            <Wallet className="w-12 h-12 mx-auto mb-4" />
            <p className="text-xl font-bold mb-2">Inicia sesión</p>
            <p className="text-[#393939] mb-4">Necesitas registrarte para acceder a tu dashboard.</p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-black text-white border-4 border-black rounded-xl px-6 py-3 font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all"
            >
              Registrarse
            </Link>
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
              Hola, <span className="bg-ve-yellow px-2">{profile?.nombre || user?.nombre || "Anon"}</span>
            </h1>
            <p className="text-[#393939] text-[16px] font-medium mt-1">
              {profile?.bio || `${profile?.role || "freelancer"} · ${profile?.email}`}
            </p>
          </div>
          <div className="flex gap-3 items-center">
            {/* View mode toggle */}
            <div className="flex bg-[#F5F5F5] border-3 border-black rounded-xl overflow-hidden">
              <button
                onClick={() => setViewMode("freelancer")}
                className={`px-4 py-2.5 text-xs font-bold transition-all flex items-center gap-1.5 ${viewMode === "freelancer" ? "bg-[#9945FF] text-white" : "hover:bg-[#EBEBEB]"}`}
              >
                <Briefcase className="w-3.5 h-3.5" /> Freelancer
              </button>
              <button
                onClick={() => setViewMode("client")}
                className={`px-4 py-2.5 text-xs font-bold transition-all flex items-center gap-1.5 ${viewMode === "client" ? "bg-[#2775CA] text-white" : "hover:bg-[#EBEBEB]"}`}
              >
                <Eye className="w-3.5 h-3.5" /> Contratista
              </button>
            </div>
            <Link
              href="/marketplace"
              className="inline-flex items-center justify-center gap-2 bg-white text-black border-4 border-black rounded-xl px-5 py-2.5 font-bold text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all"
            >
              <Eye className="w-4 h-4" /> Marketplace
            </Link>
            {viewMode === "freelancer" && (profile?.role === "freelancer" || profile?.role === "both") && (
              <Link
                href="/services/new"
                className="inline-flex items-center justify-center gap-2 bg-black text-white border-4 border-black rounded-xl px-5 py-2.5 font-bold text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all"
              >
                <Plus className="w-4 h-4" /> Publicar Servicio
              </Link>
            )}
          </div>
        </div>

        {/* Wallet Connection Banner */}
        {!publicKey && (
          <div className="bg-gradient-to-r from-[#9945FF] to-[#14F195] border-4 border-black rounded-xl p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-white">
              <p className="font-bold text-lg">Conecta tu Wallet</p>
              <p className="text-sm opacity-90">Para ver tus balances y realizar transacciones on-chain</p>
            </div>
            <WalletMultiButton style={{
              backgroundColor: "white",
              color: "black",
              borderRadius: "0.75rem",
              height: "44px",
              fontSize: "14px",
              fontWeight: 700,
              padding: "0 24px",
              border: "3px solid black",
            }} />
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* SOL Balance */}
          {publicKey && (
            <a href={`https://explorer.solana.com/address/${publicKey.toBase58()}?cluster=devnet`} target="_blank" rel="noopener noreferrer"
              className="bg-white border-4 border-black rounded-xl p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer">
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
              <p className="text-xs text-[#9945FF] font-bold">Ver en Explorer →</p>
            </a>
          )}

          {/* USDC Balance */}
          {publicKey && (
            <a href={`https://explorer.solana.com/address/${publicKey.toBase58()}?cluster=devnet`} target="_blank" rel="noopener noreferrer"
              className="bg-white border-4 border-black rounded-xl p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer">
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
              <p className="text-xs text-[#2775CA] font-bold">Ver transacciones →</p>
            </a>
          )}

          {/* Escrow Balance */}
          <div className="bg-white border-4 border-black rounded-xl p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-[#393939]">En Escrow</p>
              <div className="w-8 h-8 bg-[#14F195] rounded-lg flex items-center justify-center border-2 border-black">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <p className="text-[28px] font-bold">
              ${orders
                .filter((o) => ["pending", "accepted", "in_progress", "delivered"].includes(o.status))
                .reduce((sum, o) => sum + o.amount_usdc, 0)
                .toFixed(2)}
            </p>
            <p className="text-xs text-[#393939] font-medium">
              USDC en {orders.filter((o) => ["pending", "accepted", "in_progress", "delivered"].includes(o.status)).length} órdenes activas
            </p>
          </div>

          {/* Services count */}
          <Link href="/orders"
            className="bg-white border-4 border-black rounded-xl p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-[#393939]">Órdenes</p>
              <div className="w-8 h-8 bg-ve-red rounded-lg flex items-center justify-center border-2 border-black">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
            </div>
            <p className="text-[28px] font-bold">{orders.length}</p>
            <p className="text-xs text-[#393939] font-medium">
              {completedOrders.length} completadas
            </p>
          </Link>
        </div>

        {/* Refresh balances */}
        {publicKey && (
          <div className="flex justify-end">
            <button
              onClick={() => fetchBalances()}
              disabled={loadingBalances}
              className="flex items-center gap-2 text-sm font-bold text-[#393939] hover:text-black transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loadingBalances ? "animate-spin" : ""}`} />
              Actualizar balances
            </button>
          </div>
        )}

        {/* My Services - Freelancer view */}
        {viewMode === "freelancer" && (
          <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[24px] font-bold">Mis Servicios</h2>
            {(profile?.role === "freelancer" || profile?.role === "both") && (
              <Link href="/services/new" className="text-sm font-bold text-[#393939] hover:text-black">
                + Nuevo servicio
              </Link>
            )}
          </div>
          {loadingServices ? (
            <div className="py-8 text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-black border-t-transparent" />
            </div>
          ) : services.length === 0 ? (
            <div className="bg-[#F5F5F5] border-4 border-black/10 rounded-xl p-8 text-center">
              <Briefcase className="w-10 h-10 mx-auto mb-3 text-gray-400" />
              <p className="text-[#393939] font-medium">No tienes servicios publicados aún.</p>
              {(profile?.role === "freelancer" || profile?.role === "both") && (
                <Link
                  href="/services/new"
                  className="inline-flex items-center gap-2 mt-4 bg-black text-white border-3 border-black rounded-lg px-5 py-2.5 font-bold text-sm shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
                >
                  <Plus className="w-4 h-4" /> Crear primer servicio
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {services.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between bg-white border-4 border-black rounded-xl p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
                >
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/marketplace/${s.id}`}
                      className="font-bold text-lg hover:underline truncate block"
                    >
                      {s.titulo}
                    </Link>
                    <p className="text-sm text-[#393939] font-medium">
                      ${s.precio_usdc} USDC · {s.delivery_days} días · {s.categoria}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-4">
                    <span
                      className={`rounded-lg px-3 py-1 text-xs font-bold border-2 border-black ${
                        s.activo
                          ? "bg-ve-yellow text-black"
                          : "bg-gray-200 text-gray-500"
                      }`}
                    >
                      {s.activo ? "Activo" : "Pausado"}
                    </span>
                    <button
                      onClick={() => handleToggle(s.id, s.activo)}
                      className="bg-white border-3 border-black rounded-lg px-3 py-1.5 text-xs font-bold hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-shadow"
                    >
                      {s.activo ? "Pausar" : "Activar"}
                    </button>
                    <Link
                      href={`/services/${s.id}/edit`}
                      className="w-8 h-8 flex items-center justify-center border-2 border-black rounded-lg hover:bg-[#F5F5F5] transition-colors"
                      title="Editar"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Link>
                    <button
                      onClick={() => handleDelete(s.id, s.titulo)}
                      className="w-8 h-8 flex items-center justify-center border-2 border-black rounded-lg hover:bg-red-50 text-[#393939] hover:text-red-600 transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
        )}

        {/* Client view - services I've hired */}
        {viewMode === "client" && (
          <section>
            <h2 className="text-[24px] font-bold mb-4">Mis Contrataciones</h2>
            {clientOrders.length === 0 ? (
              <div className="bg-[#F5F5F5] border-4 border-black/10 rounded-xl p-8 text-center">
                <Package className="w-10 h-10 mx-auto mb-3 text-gray-400" />
                <p className="text-[#393939] font-medium">No has contratado servicios aún.</p>
                <Link
                  href="/marketplace"
                  className="inline-flex items-center gap-2 mt-4 bg-[#2775CA] text-white border-3 border-black rounded-lg px-5 py-2.5 font-bold text-sm shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
                >
                  <Eye className="w-4 h-4" /> Buscar Freelancers
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {clientOrders.map((o) => (
                  <Link key={o.id} href={`/orders/${o.id}`}>
                    <div className="flex items-center justify-between bg-white border-4 border-black rounded-xl p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] transition-shadow cursor-pointer mb-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`w-10 h-10 rounded-lg border-2 border-black flex items-center justify-center shrink-0 ${
                          o.status === "completed" ? "bg-green-100" :
                          o.status === "in_progress" || o.status === "accepted" ? "bg-ve-yellow" :
                          o.status === "delivered" ? "bg-blue-100" :
                          "bg-gray-100"
                        }`}>
                          {o.status === "completed" ? <CheckCircle className="w-5 h-5 text-green-600" /> :
                           o.status === "delivered" ? <Package className="w-5 h-5 text-blue-600" /> :
                           <Clock className="w-5 h-5 text-gray-600" />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold truncate">{o.service?.titulo || "Servicio"}</p>
                          <p className="text-sm text-[#393939] font-medium">${o.amount_usdc} USDC</p>
                        </div>
                      </div>
                      <span className={`rounded-lg px-3 py-1 text-xs font-bold border-2 border-black shrink-0 ${
                        o.status === "completed" ? "bg-green-100 text-green-800" :
                        o.status === "in_progress" || o.status === "accepted" ? "bg-ve-yellow text-black" :
                        o.status === "delivered" ? "bg-blue-100 text-blue-800" :
                        o.status === "refunded" ? "bg-red-100 text-red-800" :
                        "bg-gray-100 text-gray-600"
                      }`}>
                        {o.status === "completed" ? "Completada" :
                         o.status === "accepted" ? "Aceptada" :
                         o.status === "in_progress" ? "En Progreso" :
                         o.status === "delivered" ? "Entregada" :
                         o.status === "refunded" ? "Reembolsada" :
                         o.status === "pending" ? "Pendiente" :
                         o.status}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Recent Orders */}
        {viewMode === "freelancer" && (
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
          ) : [...myOrders, ...clientOrders].length === 0 ? (
            <div className="bg-[#F5F5F5] border-4 border-black/10 rounded-xl p-8 text-center">
              <Package className="w-10 h-10 mx-auto mb-3 text-gray-400" />
              <p className="text-[#393939] font-medium">No tienes órdenes aún.</p>
              <Link
                href="/marketplace"
                className="inline-flex items-center gap-2 mt-4 bg-black text-white border-3 border-black rounded-lg px-5 py-2.5 font-bold text-sm shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
              >
                Explorar Marketplace
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {[...myOrders, ...clientOrders].slice(0, 5).map((o) => (
                <Link key={o.id} href={`/orders/${o.id}`}>
                  <div className="flex items-center justify-between bg-white border-4 border-black rounded-xl p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] transition-shadow cursor-pointer">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`w-10 h-10 rounded-lg border-2 border-black flex items-center justify-center shrink-0 ${
                        o.status === "completed" ? "bg-green-100" :
                        o.status === "in_progress" || o.status === "accepted" ? "bg-ve-yellow" :
                        o.status === "delivered" ? "bg-blue-100" :
                        "bg-gray-100"
                      }`}>
                        {o.status === "completed" ? <CheckCircle className="w-5 h-5 text-green-600" /> :
                         o.status === "delivered" ? <Package className="w-5 h-5 text-blue-600" /> :
                         <Clock className="w-5 h-5 text-gray-600" />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold truncate">
                          {o.service?.titulo || "Servicio"}
                        </p>
                        <p className="text-sm text-[#393939] font-medium">
                          ${o.amount_usdc} USDC · {o.freelancer_id === profile?.id ? "Como freelancer" : "Como cliente"}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`rounded-lg px-3 py-1 text-xs font-bold border-2 border-black shrink-0 ${
                        o.status === "completed" ? "bg-green-100 text-green-800" :
                        o.status === "in_progress" || o.status === "accepted" ? "bg-ve-yellow text-black" :
                        o.status === "delivered" ? "bg-blue-100 text-blue-800" :
                        o.status === "refunded" ? "bg-red-100 text-red-800" :
                        "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {o.status === "completed" ? "Completada" :
                       o.status === "accepted" ? "Aceptada" :
                       o.status === "in_progress" ? "En Progreso" :
                       o.status === "delivered" ? "Entregada" :
                       o.status === "refunded" ? "Reembolsada" :
                       o.status === "pending" ? "Pendiente" :
                       o.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
        )}
      </div>
    </>
  );
}
