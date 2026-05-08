"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useOrders } from "@/hooks/useOrders";
import { Navigation } from "@/components/navigation";
import OrderCard from "@/components/OrderCard";
import { Wallet, ClipboardList } from "lucide-react";

type Tab = "freelancer" | "client";

export default function OrdersPage() {
  const { publicKey } = useWallet();
  const [tab, setTab] = useState<Tab>("freelancer");
  const { freelancerOrders, clientOrders, loading } = useOrders();

  if (!publicKey) {
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

  const orders = tab === "freelancer" ? freelancerOrders : clientOrders;

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
        ) : orders.length === 0 ? (
          <div className="bg-[#F5F5F5] border-4 border-black/10 rounded-xl p-12 text-center">
            <ClipboardList className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-bold text-[#393939]">
              No tienes órdenes como {tab === "freelancer" ? "freelancer" : "cliente"}.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((o) => (
              <OrderCard
                key={o.publicKey.toBase58()}
                order={o.account}
                orderKey={o.publicKey}
                role={tab}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
