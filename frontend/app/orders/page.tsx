"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { useSession } from "@/contexts/session-context";
import { Navigation } from "@/components/navigation";
import {
  getProfileByEmail,
  getProfileByWallet,
  getOrdersByUser,
  Order,
  Profile,
} from "@/lib/supabase";
import {
  Wallet, ClipboardList, Clock, CheckCircle, Package,
  AlertTriangle, ArrowRight,
} from "lucide-react";

type Tab = "freelancer" | "client";

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: "Pendiente", color: "bg-orange-100 text-orange-800", icon: <Clock className="w-3.5 h-3.5" /> },
  accepted: { label: "Aceptada", color: "bg-blue-100 text-blue-700", icon: <CheckCircle className="w-3.5 h-3.5" /> },
  in_progress: { label: "En Progreso", color: "bg-blue-100 text-blue-700", icon: <Clock className="w-3.5 h-3.5" /> },
  delivered: { label: "Entregado", color: "bg-yellow-100 text-yellow-700", icon: <Package className="w-3.5 h-3.5" /> },
  completed: { label: "Completado", color: "bg-green-100 text-green-700", icon: <CheckCircle className="w-3.5 h-3.5" /> },
  refunded: { label: "Reembolsado", color: "bg-red-100 text-red-700", icon: <AlertTriangle className="w-3.5 h-3.5" /> },
  cancelled: { label: "Cancelado", color: "bg-gray-100 text-gray-500", icon: <AlertTriangle className="w-3.5 h-3.5" /> },
};

export default function OrdersPage() {
  const { publicKey } = useWallet();
  const { user, loading: sessionLoading } = useSession();
  const [tab, setTab] = useState<Tab>("freelancer");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    let p: Profile | null = null;
    if (user?.email) p = await getProfileByEmail(user.email);
    if (!p && publicKey) p = await getProfileByWallet(publicKey.toBase58());
    setProfile(p);
    if (p) {
      const ords = await getOrdersByUser(p.id);
      setOrders(ords);
    }
    setLoading(false);
  }, [user?.email, publicKey]);

  useEffect(() => {
    if (!sessionLoading || publicKey) fetchData();
  }, [sessionLoading, publicKey, fetchData]);

  if (!publicKey && !user) {
    return (
      <>
        <Navigation />
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="bg-white border-4 border-black rounded-xl p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-center max-w-md mx-4">
            <Wallet className="w-12 h-12 mx-auto mb-4" />
            <p className="text-xl font-bold mb-2">Conecta tu wallet</p>
            <p className="text-[#393939]">Para ver tus órdenes necesitas conectar tu wallet.</p>
          </div>
        </div>
      </>
    );
  }

  const freelancerOrders = orders.filter((o) => o.freelancer_id === profile?.id);
  const clientOrders = orders.filter((o) => o.client_id === profile?.id);
  const displayOrders = tab === "freelancer" ? freelancerOrders : clientOrders;

  return (
    <>
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-3xl space-y-6">
        <h1 className="text-[32px] md:text-[42px] font-bold leading-tight">
          Mis <span className="bg-ve-yellow px-2">Órdenes</span>
        </h1>

        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setTab("freelancer")}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-[16px] border-4 transition-all ${
              tab === "freelancer"
                ? "bg-black text-white border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                : "bg-white text-black border-black/20 hover:border-black hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
            }`}
          >
            Freelancer ({freelancerOrders.length})
          </button>
          <button
            onClick={() => setTab("client")}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-[16px] border-4 transition-all ${
              tab === "client"
                ? "bg-black text-white border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                : "bg-white text-black border-black/20 hover:border-black hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
            }`}
          >
            Cliente ({clientOrders.length})
          </button>
        </div>

        {/* Orders list */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-black border-t-transparent" />
          </div>
        ) : displayOrders.length === 0 ? (
          <div className="bg-[#F5F5F5] border-4 border-black/10 rounded-xl p-12 text-center">
            <ClipboardList className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-bold text-[#393939]">
              No tienes órdenes como {tab === "freelancer" ? "freelancer" : "cliente"}.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayOrders.map((o) => {
              const sc = statusConfig[o.status] || statusConfig.pending;
              return (
                <Link key={o.id} href={`/orders/${o.id}`}>
                  <div className="bg-white border-4 border-black rounded-xl p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] transition-shadow cursor-pointer">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="mb-1 flex items-center gap-2 flex-wrap">
                          <span className={`flex items-center gap-1 rounded-lg px-2.5 py-0.5 text-xs font-bold border-2 border-black ${sc.color}`}>
                            {sc.icon} {sc.label}
                          </span>
                          <span className="text-xs font-bold text-[#2775CA]">
                            ${o.amount_usdc} USDC
                          </span>
                        </div>
                        <p className="font-bold text-sm truncate">
                          {o.service?.titulo || "Servicio"}
                        </p>
                        <p className="text-xs text-[#393939] font-medium mt-0.5">
                          {tab === "freelancer" ? `Cliente: ${o.client?.nombre || "—"}` : `Freelancer: ${o.freelancer?.nombre || "—"}`}
                          {" · "}
                          {new Date(o.created_at).toLocaleDateString("es-VE")}
                        </p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-[#393939] shrink-0" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
