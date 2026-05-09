"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { PublicKey } from "@solana/web3.js";
import { useAnchorWallet, useWallet } from "@solana/wallet-adapter-react";
import { formatUSDC, shortWallet, statusLabel, statusColor, timeRemaining } from "@/lib/utils";
import { getOrdersByUser, getProfileByWallet, Order as DbOrder } from "@/lib/supabase";
import { Clock, CheckCircle, Package, AlertTriangle, ArrowRight } from "lucide-react";

interface OrderCardProps {
  order: {
    client: PublicKey;
    freelancer: PublicKey;
    service: PublicKey;
    amount: { toNumber: () => number };
    status: { inProgress?: object; delivered?: object; completed?: object; refunded?: object };
    deadline: { toNumber: () => number };
    createdAt: { toNumber: () => number };
    bump: number;
  };
  orderKey: PublicKey;
  role: "freelancer" | "client";
}

export default function OrderCard({ order, orderKey, role }: OrderCardProps) {
  const { publicKey } = useWallet();
  const [dbOrderId, setDbOrderId] = useState<string | null>(null);

  const label = statusLabel(order.status);
  const color = statusColor(order.status);
  const deadline = order.deadline.toNumber();
  const remaining = timeRemaining(deadline);

  // Try to find matching Supabase order
  useEffect(() => {
    async function findDbOrder() {
      if (!publicKey) return;
      const profile = await getProfileByWallet(publicKey.toBase58());
      if (!profile) return;
      const orders = await getOrdersByUser(profile.id);
      // Match by amount (micro USDC vs regular USDC)
      const amountUsdc = order.amount.toNumber() / 1_000_000;
      const match = orders.find(
        (o) =>
          Math.abs(o.amount_usdc - amountUsdc) < 0.01 &&
          ["pending", "accepted", "in_progress", "delivered", "completed", "refunded"].includes(o.status)
      );
      if (match) setDbOrderId(match.id);
    }
    findDbOrder();
  }, [publicKey, order.amount]);

  const card = (
    <div className="bg-white border-4 border-black rounded-xl p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] transition-shadow">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <div className="mb-1 flex items-center gap-2">
            <span className={`rounded-lg px-2.5 py-0.5 text-xs font-bold border-2 border-black ${color}`}>
              {label}
            </span>
            <span className="text-xs font-bold text-[#393939]">
              {formatUSDC(order.amount.toNumber())}
            </span>
          </div>
          <p className="text-sm text-[#393939] font-medium">
            {role === "freelancer" ? "Cliente" : "Freelancer"}:{" "}
            <span className="font-mono text-xs">
              {shortWallet(
                role === "freelancer"
                  ? order.client.toBase58()
                  : order.freelancer.toBase58()
              )}
            </span>
          </p>
          {(label === "En Progreso" || label === "Entregado") && (
            <p className="mt-1 text-xs text-[#393939]">
              Deadline: {remaining}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <ArrowRight className="w-5 h-5 text-[#393939]" />
        </div>
      </div>
    </div>
  );

  if (dbOrderId) {
    return <Link href={`/orders/${dbOrderId}`}>{card}</Link>;
  }

  return card;
}
