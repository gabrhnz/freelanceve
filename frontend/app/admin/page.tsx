"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { useSession } from "@/contexts/session-context";
import { Navigation } from "@/components/navigation";
import {
  getProfileByEmail, getProfileByWallet,
  getAllOrders, getAllProfiles, getAllServices, getAllReports,
  updateOrderStatus, blockUser, unblockUser, adminCancelOrder, adminRefundOrder,
  Order, Profile,
} from "@/lib/supabase";
import {
  ShieldCheck, Package, Users, Briefcase, DollarSign,
  Clock, CheckCircle, AlertTriangle, XCircle, Filter,
  Eye, TrendingUp, BarChart3, Ban, Undo2, Loader2, Flag,
} from "lucide-react";
import toast from "react-hot-toast";

const ADMIN_IDS = [
  "arepaweb3@gmail.com",
];

export default function AdminPage() {
  const { publicKey } = useWallet();
  const { user, loading: sessionLoading } = useSession();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [orders, setOrders] = useState<Order[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [tab, setTab] = useState<"overview" | "orders" | "users" | "services" | "reports">("overview");

  const fetchProfile = useCallback(async () => {
    let p: Profile | null = null;
    if (user?.email) p = await getProfileByEmail(user.email);
    if (!p && publicKey) p = await getProfileByWallet(publicKey.toBase58());
    setProfile(p);
    const adminCheck =
      (p?.email && ADMIN_IDS.includes(p.email)) ||
      (p?.wallet_address && ADMIN_IDS.includes(p.wallet_address)) ||
      p?.role === "both";
    setIsAdmin(!!adminCheck);
    setLoading(false);
  }, [user?.email, publicKey]);

  const fetchData = useCallback(async () => {
    const [o, p, s, r] = await Promise.all([
      getAllOrders(statusFilter),
      getAllProfiles(),
      getAllServices(),
      getAllReports(),
    ]);
    setOrders(o);
    setProfiles(p);
    setServices(s);
    setReports(r);
  }, [statusFilter]);

  useEffect(() => {
    if (!sessionLoading || publicKey) fetchProfile();
  }, [sessionLoading, publicKey, fetchProfile]);

  useEffect(() => {
    if (isAdmin) fetchData();
  }, [isAdmin, fetchData]);

  // Admin actions
  const handleCancelOrder = async (orderId: string) => {
    if (!confirm("¿Cancelar esta orden? No se puede deshacer.")) return;
    setActionLoading(orderId);
    const ok = await adminCancelOrder(orderId);
    if (ok) { toast.success("Orden cancelada"); fetchData(); }
    else toast.error("Error al cancelar");
    setActionLoading(null);
  };

  const handleRefundOrder = async (orderId: string) => {
    if (!confirm("¿Reembolsar esta orden? El USDC será devuelto al cliente.")) return;
    setActionLoading(orderId);
    const ok = await adminRefundOrder(orderId);
    if (ok) { toast.success("Orden reembolsada"); fetchData(); }
    else toast.error("Error al reembolsar");
    setActionLoading(null);
  };

  const handleBlockUser = async (userId: string) => {
    if (!confirm("¿Bloquear este usuario?")) return;
    setActionLoading(userId);
    const ok = await blockUser(userId);
    if (ok) { toast.success("Usuario bloqueado"); fetchData(); }
    else toast.error("Error");
    setActionLoading(null);
  };

  const handleUnblockUser = async (userId: string) => {
    setActionLoading(userId);
    const ok = await unblockUser(userId);
    if (ok) { toast.success("Usuario desbloqueado"); fetchData(); }
    else toast.error("Error");
    setActionLoading(null);
  };

  // Stats
  const totalEscrow = orders
    .filter((o) => ["pending", "accepted", "in_progress", "delivered"].includes(o.status))
    .reduce((s, o) => s + o.amount_usdc, 0);
  const totalCompleted = orders.filter((o) => o.status === "completed").reduce((s, o) => s + o.amount_usdc, 0);
  const activeOrders = orders.filter((o) => ["pending", "accepted", "in_progress"].includes(o.status)).length;
  const disputeOrders = orders.filter((o) => o.status === "refunded").length;
  const blockedUsers = profiles.filter((p) => p.blocked_at).length;
  const onlineUsers = profiles.filter((p) => p.last_seen && (Date.now() - new Date(p.last_seen).getTime()) < 24 * 60 * 60 * 1000).length;

  if (loading || sessionLoading) {
    return (<><Navigation /><div className="flex min-h-[60vh] items-center justify-center"><div className="h-12 w-12 animate-spin rounded-full border-4 border-black border-t-transparent" /></div></>);
  }

  if (!isAdmin) {
    return (
      <><Navigation />
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="bg-white border-4 border-black rounded-xl p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-center max-w-md mx-4">
            <ShieldCheck className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <p className="text-xl font-bold mb-2">Acceso restringido</p>
            <p className="text-[#393939]">No tienes permisos de administrador.</p>
          </div>
        </div>
      </>
    );
  }

  const statusColors: Record<string, string> = {
    pending: "bg-orange-100 text-orange-800", accepted: "bg-blue-100 text-blue-700",
    in_progress: "bg-yellow-100 text-yellow-800", delivered: "bg-purple-100 text-purple-700",
    completed: "bg-green-100 text-green-800", refunded: "bg-red-100 text-red-700",
    cancelled: "bg-gray-100 text-gray-500",
  };
  const statusLabels: Record<string, string> = {
    pending: "Pendiente", accepted: "Aceptada", in_progress: "En Progreso",
    delivered: "Entregada", completed: "Completada", refunded: "Reembolsada", cancelled: "Cancelada",
  };

  const escrowOrders = orders.filter((o) => ["pending", "in_progress", "delivered", "accepted"].includes(o.status) && o.tx_signature);

  return (
    <>
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-500 rounded-lg border-2 border-black flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-[28px] md:text-[36px] font-bold leading-tight">Panel Admin</h1>
            <p className="text-xs font-bold text-[#393939]">{profile?.email || profile?.wallet_address}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {(["overview", "orders", "users", "reports", "services"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg border-2 border-black text-sm font-bold whitespace-nowrap transition-all ${
                tab === t ? "bg-black text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]" : "bg-white hover:bg-[#F5F5F5]"
              }`}>
              {t === "overview" ? "📊 Resumen" : t === "orders" ? "📦 Órdenes" : t === "users" ? "👥 Usuarios" : t === "reports" ? "🚩 Reportes" : "💼 Servicios"}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {tab === "overview" && (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <div className="bg-white border-4 border-black rounded-xl p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-bold text-[#393939]">En Escrow</p>
                  <div className="w-8 h-8 bg-[#14F195] rounded-lg flex items-center justify-center border-2 border-black"><DollarSign className="w-4 h-4" /></div>
                </div>
                <p className="text-[28px] font-bold">${totalEscrow.toFixed(2)}</p>
                <p className="text-xs text-[#393939] font-medium">{escrowOrders.length} órdenes con USDC</p>
              </div>
              <div className="bg-white border-4 border-black rounded-xl p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-bold text-[#393939]">Completado</p>
                  <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center border-2 border-black"><TrendingUp className="w-4 h-4 text-white" /></div>
                </div>
                <p className="text-[28px] font-bold">${totalCompleted.toFixed(2)}</p>
                <p className="text-xs text-green-600 font-bold">{orders.filter((o) => o.status === "completed").length} órdenes</p>
              </div>
              <div className="bg-white border-4 border-black rounded-xl p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-bold text-[#393939]">Usuarios</p>
                  <div className="w-8 h-8 bg-[#9945FF] rounded-lg flex items-center justify-center border-2 border-black"><Users className="w-4 h-4 text-white" /></div>
                </div>
                <p className="text-[28px] font-bold">{profiles.length}</p>
                <p className="text-xs text-[#393939] font-medium">{onlineUsers} online · {blockedUsers} bloqueados</p>
              </div>
              <div className="bg-white border-4 border-black rounded-xl p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-bold text-[#393939]">Servicios</p>
                  <div className="w-8 h-8 bg-ve-yellow rounded-lg flex items-center justify-center border-2 border-black"><Briefcase className="w-4 h-4" /></div>
                </div>
                <p className="text-[28px] font-bold">{services.length}</p>
                <p className="text-xs text-[#393939] font-medium">{services.filter((s: any) => s.activo).length} activos</p>
              </div>
              <div className="bg-white border-4 border-black rounded-xl p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-bold text-[#393939]">Reportes</p>
                  <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center border-2 border-black"><Flag className="w-4 h-4 text-white" /></div>
                </div>
                <p className="text-[28px] font-bold">{reports.length}</p>
                <p className="text-xs text-red-600 font-bold">{reports.filter((r: any) => r.status === "pending").length} pendientes</p>
              </div>
            </div>

            {/* Order breakdown */}
            <div className="bg-white border-4 border-black rounded-xl p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <h3 className="font-bold mb-4 flex items-center gap-2"><BarChart3 className="w-5 h-5" /> Desglose de Órdenes</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
                {Object.entries(statusLabels).map(([key, label]) => {
                  const count = orders.filter((o) => o.status === key).length;
                  const amount = orders.filter((o) => o.status === key).reduce((s, o) => s + o.amount_usdc, 0);
                  return (
                    <button key={key} onClick={() => { setStatusFilter(key); setTab("orders"); }}
                      className={`p-3 rounded-lg border-2 border-black text-center hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-shadow ${statusColors[key]}`}>
                      <p className="text-xl font-bold">{count}</p>
                      <p className="text-[10px] font-bold">{label}</p>
                      <p className="text-[10px] font-medium">${amount.toFixed(0)}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Escrow Management */}
            {escrowOrders.length > 0 && (
              <div className="bg-[#14F195]/10 border-4 border-[#14F195] rounded-xl p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]">
                <h3 className="font-bold mb-3 flex items-center gap-2"><DollarSign className="w-5 h-5" /> USDC en Escrow ({escrowOrders.length})</h3>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {escrowOrders.map((o) => (
                    <div key={o.id} className="bg-white border-2 border-black rounded-lg p-3 flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate">{o.service?.titulo || "Orden"}</p>
                        <p className="text-xs text-[#393939]">{o.client?.nombre} → {o.freelancer?.nombre} · <span className="font-bold text-[#2775CA]">${o.amount_usdc}</span></p>
                      </div>
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded border border-black/20 ${statusColors[o.status]}`}>{statusLabels[o.status]}</span>
                      <div className="flex gap-1">
                        <button onClick={() => handleRefundOrder(o.id)} disabled={actionLoading === o.id}
                          className="px-2 py-1 bg-orange-500 text-white rounded border border-black text-[10px] font-bold hover:bg-orange-600 disabled:opacity-40" title="Reembolsar">
                          {actionLoading === o.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Undo2 className="w-3 h-3" />}
                        </button>
                        <button onClick={() => handleCancelOrder(o.id)} disabled={actionLoading === o.id}
                          className="px-2 py-1 bg-red-500 text-white rounded border border-black text-[10px] font-bold hover:bg-red-600 disabled:opacity-40" title="Cancelar">
                          <XCircle className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Orders Tab */}
        {tab === "orders" && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {["all", ...Object.keys(statusLabels)].map((s) => (
                <button key={s} onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-lg border-2 border-black text-xs font-bold transition-all ${
                    statusFilter === s ? "bg-black text-white" : "bg-white hover:bg-[#F5F5F5]"
                  }`}>
                  {s === "all" ? "Todas" : statusLabels[s]} ({s === "all" ? orders.length : orders.filter((o) => o.status === s).length})
                </button>
              ))}
            </div>
            <div className="space-y-2">
              {orders.length === 0 ? (
                <p className="text-center py-8 text-[#393939] font-medium">No hay órdenes con este filtro.</p>
              ) : orders.map((o) => (
                <div key={o.id} className="bg-white border-3 border-black rounded-xl p-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <Link href={`/orders/${o.id}`} className="font-bold text-sm truncate hover:underline block">{o.service?.titulo || "Orden"}</Link>
                    <p className="text-xs text-[#393939]">
                      {o.client?.nombre || "?"} → {o.freelancer?.nombre || "?"} · <span className="font-bold">${o.amount_usdc}</span>
                      {o.tx_signature && <span className="text-green-600 ml-1">· TX ✓</span>}
                      {!o.tx_signature && <span className="text-orange-500 ml-1">· Sin pago</span>}
                    </p>
                    <p className="text-[10px] text-[#393939] mt-0.5">{new Date(o.created_at).toLocaleDateString("es-VE")} · {o.id.slice(0, 8)}</p>
                  </div>
                  <span className={`rounded-lg px-3 py-1 text-xs font-bold border border-black/20 flex-shrink-0 ${statusColors[o.status] || "bg-gray-100"}`}>
                    {statusLabels[o.status] || o.status}
                  </span>
                  {!["completed", "refunded", "cancelled"].includes(o.status) && (
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={() => handleRefundOrder(o.id)} disabled={actionLoading === o.id}
                        className="px-2 py-1.5 bg-orange-500 text-white rounded-lg border-2 border-black text-[10px] font-bold hover:bg-orange-600 disabled:opacity-40 flex items-center gap-1" title="Reembolsar">
                        {actionLoading === o.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Undo2 className="w-3 h-3" /> Reembolsar</>}
                      </button>
                      <button onClick={() => handleCancelOrder(o.id)} disabled={actionLoading === o.id}
                        className="px-2 py-1.5 bg-red-500 text-white rounded-lg border-2 border-black text-[10px] font-bold hover:bg-red-600 disabled:opacity-40 flex items-center gap-1" title="Cancelar">
                        <XCircle className="w-3 h-3" /> Cancelar
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Users Tab */}
        {tab === "users" && (
          <div className="space-y-2">
            <p className="text-sm font-bold text-[#393939] mb-3">{profiles.length} usuarios · {blockedUsers} bloqueados</p>
            {profiles.map((p) => {
              const online = p.last_seen && (Date.now() - new Date(p.last_seen).getTime()) < 24 * 60 * 60 * 1000;
              const isBlocked = !!p.blocked_at;
              return (
                <div key={p.id} className={`bg-white border-3 rounded-xl p-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-3 ${isBlocked ? "border-red-400 bg-red-50" : "border-black"}`}>
                  <div className="relative flex-shrink-0">
                    <div className={`w-10 h-10 rounded-full border-2 border-black flex items-center justify-center text-white font-bold overflow-hidden ${isBlocked ? "bg-red-400" : "bg-[#9945FF]"}`}>
                      {p.avatar_url ? <img src={p.avatar_url} alt="" className="w-full h-full object-cover" /> : p.nombre?.charAt(0).toUpperCase() || "?"}
                    </div>
                    <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${online ? "bg-green-500" : "bg-gray-300"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{p.nombre} {isBlocked && <span className="text-red-500 text-[10px]">🚫 BLOQUEADO</span>}</p>
                    <p className="text-[10px] text-[#393939]">{p.email || p.wallet_address?.slice(0, 16) + "..."} · {p.role}</p>
                  </div>
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded border ${online ? "bg-green-50 text-green-600 border-green-200" : "bg-gray-50 text-gray-400 border-gray-200"}`}>
                    {online ? "Online" : "Offline"}
                  </span>
                  {isBlocked ? (
                    <button onClick={() => handleUnblockUser(p.id)} disabled={actionLoading === p.id}
                      className="px-3 py-1.5 bg-green-500 text-white rounded-lg border-2 border-black text-[10px] font-bold hover:bg-green-600 disabled:opacity-40 flex items-center gap-1">
                      {actionLoading === p.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <><CheckCircle className="w-3 h-3" /> Desbloquear</>}
                    </button>
                  ) : (
                    <button onClick={() => handleBlockUser(p.id)} disabled={actionLoading === p.id}
                      className="px-3 py-1.5 bg-red-500 text-white rounded-lg border-2 border-black text-[10px] font-bold hover:bg-red-600 disabled:opacity-40 flex items-center gap-1">
                      {actionLoading === p.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Ban className="w-3 h-3" /> Bloquear</>}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Reports Tab */}
        {tab === "reports" && (
          <div className="space-y-2">
            <p className="text-sm font-bold text-[#393939] mb-3">{reports.length} reportes</p>
            {reports.length === 0 ? (
              <p className="text-center py-8 text-[#393939] font-medium">No hay reportes.</p>
            ) : reports.map((r: any) => (
              <div key={r.id} className="bg-white border-3 border-red-300 rounded-xl p-4 shadow-[2px_2px_0px_0px_rgba(220,38,38,0.2)]">
                <div className="flex items-center gap-2 mb-2">
                  <Flag className="w-4 h-4 text-red-500" />
                  <span className="text-xs font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded border border-red-200">{r.reason}</span>
                  <span className="text-[10px] text-[#393939] ml-auto">{new Date(r.created_at).toLocaleDateString("es-VE")}</span>
                </div>
                <p className="text-sm font-medium text-[#393939]">{r.details || "Sin detalles"}</p>
                <p className="text-[10px] text-[#393939] mt-1">Reportado por: {r.reporter?.nombre || r.reporter?.email || "?"}</p>
                {r.reported_user_id && (
                  <button onClick={() => handleBlockUser(r.reported_user_id)} disabled={actionLoading === r.reported_user_id}
                    className="mt-2 px-3 py-1.5 bg-red-500 text-white rounded-lg border-2 border-black text-[10px] font-bold hover:bg-red-600 disabled:opacity-40 flex items-center gap-1">
                    {actionLoading === r.reported_user_id ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Ban className="w-3 h-3" /> Bloquear usuario reportado</>}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Services Tab */}
        {tab === "services" && (
          <div className="space-y-2">
            <p className="text-sm font-bold text-[#393939] mb-3">{services.length} servicios · {services.filter((s: any) => s.activo).length} activos</p>
            {services.map((s: any) => (
              <Link key={s.id} href={`/marketplace/${s.id}`}>
                <div className="bg-white border-3 border-black rounded-xl p-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{s.titulo}</p>
                    <p className="text-xs text-[#393939]">
                      {s.owner?.nombre || "?"} · ${s.precio_usdc} USDC · {s.delivery_days} días · {s.categoria}
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded border-2 border-black ${s.activo ? "bg-ve-yellow" : "bg-gray-200 text-gray-500"}`}>
                    {s.activo ? "Activo" : "Pausado"}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
