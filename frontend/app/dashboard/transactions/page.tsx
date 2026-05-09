"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { Navigation } from "@/components/navigation";
import { useSession } from "@/contexts/session-context";
import {
  Profile,
  Order as DbOrder,
  getProfileByEmail,
  getProfileByWallet,
  getOrdersByUser,
} from "@/lib/supabase";
import {
  ArrowLeft, ExternalLink, Clock, CheckCircle, Package,
  ArrowUpRight, ArrowDownLeft, XCircle, Truck, RefreshCw,
} from "lucide-react";

const EXPLORER_BASE = "https://explorer.solana.com/tx";
const CLUSTER_PARAM = "?cluster=devnet";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: "Pendiente", color: "bg-gray-200 text-gray-700", icon: <Clock className="w-3.5 h-3.5" /> },
  accepted: { label: "Aceptado", color: "bg-blue-100 text-blue-700", icon: <CheckCircle className="w-3.5 h-3.5" /> },
  in_progress: { label: "En progreso", color: "bg-yellow-100 text-yellow-700", icon: <RefreshCw className="w-3.5 h-3.5" /> },
  delivered: { label: "Entregado", color: "bg-purple-100 text-purple-700", icon: <Truck className="w-3.5 h-3.5" /> },
  completed: { label: "Completado", color: "bg-green-100 text-green-700", icon: <CheckCircle className="w-3.5 h-3.5" /> },
  refunded: { label: "Reembolsado", color: "bg-orange-100 text-orange-700", icon: <XCircle className="w-3.5 h-3.5" /> },
  cancelled: { label: "Cancelado", color: "bg-red-100 text-red-700", icon: <XCircle className="w-3.5 h-3.5" /> },
};

export default function TransactionsPage() {
  const { publicKey } = useWallet();
  const { user, loading: sessionLoading } = useSession();
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [orders, setOrders] = useState<DbOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "sent" | "received">("all");

  const fetchData = useCallback(async () => {
    let p: Profile | null = null;
    if (user?.email) p = await getProfileByEmail(user.email);
    if (!p && publicKey) p = await getProfileByWallet(publicKey.toBase58());
    if (!p) {
      if (!sessionLoading) router.push("/register");
      setLoading(false);
      return;
    }
    setProfile(p);
    const ords = await getOrdersByUser(p.id);
    setOrders(ords);
    setLoading(false);
  }, [user?.email, publicKey, sessionLoading, router]);

  useEffect(() => {
    if (!sessionLoading || publicKey) fetchData();
  }, [sessionLoading, publicKey, fetchData]);

  const filteredOrders = orders.filter((o) => {
    if (filter === "sent") return o.client_id === profile?.id;
    if (filter === "received") return o.freelancer_id === profile?.id;
    return true;
  });

  if (loading || sessionLoading) {
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
      <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="w-10 h-10 bg-white border-3 border-black rounded-lg flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-[28px] md:text-[36px] font-bold leading-tight">
              Historial de <span className="bg-ve-yellow px-2">Transacciones</span>
            </h1>
            <p className="text-[#393939] text-sm font-medium mt-1">
              {orders.length} transaccion{orders.length !== 1 ? "es" : ""} total{orders.length !== 1 ? "es" : ""}
            </p>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2">
          {([
            { key: "all", label: "Todas" },
            { key: "sent", label: "Enviadas (pagos)" },
            { key: "received", label: "Recibidas (cobros)" },
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-4 py-2 text-sm font-bold border-3 border-black rounded-lg transition-all ${
                filter === key
                  ? "bg-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  : "bg-white text-black hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Transactions list */}
        {filteredOrders.length === 0 ? (
          <div className="bg-[#F5F5F5] border-4 border-black/10 rounded-xl p-12 text-center">
            <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-xl font-bold mb-2">Sin transacciones</p>
            <p className="text-[#393939] font-medium text-sm">
              Tus transacciones con USDC aparecerán aquí.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredOrders.map((order) => {
              const isSender = order.client_id === profile?.id;
              const counterparty = isSender ? order.freelancer : order.client;
              const statusCfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;

              return (
                <div
                  key={order.id}
                  className="bg-white border-4 border-black rounded-xl p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] transition-all"
                >
                  <div className="flex items-center gap-4">
                    {/* Direction icon */}
                    <div className={`w-10 h-10 rounded-lg border-2 border-black flex items-center justify-center flex-shrink-0 ${
                      isSender ? "bg-red-100" : "bg-green-100"
                    }`}>
                      {isSender ? (
                        <ArrowUpRight className="w-5 h-5 text-red-600" />
                      ) : (
                        <ArrowDownLeft className="w-5 h-5 text-green-600" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-bold text-sm truncate">
                          {order.service?.titulo || "Servicio"}
                        </p>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${statusCfg.color}`}>
                          {statusCfg.icon} {statusCfg.label}
                        </span>
                      </div>
                      <p className="text-xs text-[#393939] font-medium">
                        {isSender ? "Pagado a" : "Recibido de"}{" "}
                        <span className="font-bold">{counterparty?.nombre || "Usuario"}</span>
                        {" · "}
                        {new Date(order.created_at).toLocaleDateString("es-VE", {
                          day: "numeric", month: "short", year: "numeric"
                        })}
                      </p>
                    </div>

                    {/* Amount */}
                    <div className="text-right flex-shrink-0">
                      <p className={`font-bold text-sm ${isSender ? "text-red-600" : "text-green-600"}`}>
                        {isSender ? "-" : "+"}${order.amount_usdc} USDC
                      </p>
                    </div>
                  </div>

                  {/* TX signature row */}
                  <div className="mt-3 pt-3 border-t-2 border-black/10 flex items-center justify-between">
                    <Link
                      href={`/orders/${order.id}`}
                      className="text-xs font-bold text-[#9945FF] hover:underline"
                    >
                      Ver orden →
                    </Link>
                    {order.tx_signature ? (
                      <a
                        href={`${EXPLORER_BASE}/${order.tx_signature}${CLUSTER_PARAM}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-bold text-[#2775CA] hover:underline"
                      >
                        <span className="font-mono">{order.tx_signature.slice(0, 8)}...{order.tx_signature.slice(-6)}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-xs text-gray-400 font-medium">Sin tx on-chain</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
