"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useOrders } from "@/hooks/useOrders";
import OrderCard from "@/components/OrderCard";

type Tab = "freelancer" | "client";

export default function OrdersPage() {
  const { publicKey } = useWallet();
  const [tab, setTab] = useState<Tab>("freelancer");
  const { freelancerOrders, clientOrders, loading } = useOrders();

  if (!publicKey) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-lg text-gray-500">
          Conecta tu wallet para ver tus órdenes.
        </p>
      </div>
    );
  }

  const orders = tab === "freelancer" ? freelancerOrders : clientOrders;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-3xl font-extrabold dark:text-white">Mis Órdenes</h1>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
        <button
          onClick={() => setTab("freelancer")}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-semibold transition ${
            tab === "freelancer"
              ? "bg-white text-ve-blue shadow dark:bg-gray-900 dark:text-ve-yellow"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
          }`}
        >
          Como Freelancer ({freelancerOrders.length})
        </button>
        <button
          onClick={() => setTab("client")}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-semibold transition ${
            tab === "client"
              ? "bg-white text-ve-blue shadow dark:bg-gray-900 dark:text-ve-yellow"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
          }`}
        >
          Como Cliente ({clientOrders.length})
        </button>
      </div>

      {/* Orders list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-ve-blue border-t-transparent" />
        </div>
      ) : orders.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-lg text-gray-500 dark:text-gray-400">
            No tienes órdenes como{" "}
            {tab === "freelancer" ? "freelancer" : "cliente"}.
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
  );
}
