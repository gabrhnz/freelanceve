"use client";

import { useEffect, useState, useCallback } from "react";
import { PublicKey } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import { getReadonlyProgram } from "@/lib/anchor";

export interface OrderAccountData {
  client: PublicKey;
  freelancer: PublicKey;
  service: PublicKey;
  amount: { toNumber: () => number };
  status: { inProgress?: object; delivered?: object; completed?: object; refunded?: object };
  deadline: { toNumber: () => number };
  createdAt: { toNumber: () => number };
  bump: number;
}

export interface OrderWithKey {
  publicKey: PublicKey;
  account: OrderAccountData;
}

export function useOrders() {
  const { publicKey } = useWallet();
  const [freelancerOrders, setFreelancerOrders] = useState<OrderWithKey[]>([]);
  const [clientOrders, setClientOrders] = useState<OrderWithKey[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    if (!publicKey) {
      setLoading(false);
      return;
    }
    try {
      const program = getReadonlyProgram();
      const allOrders = await program.account.order.all();
      const typed = allOrders as unknown as OrderWithKey[];

      const asFreelancer = typed.filter(
        (o) => o.account.freelancer.toBase58() === publicKey.toBase58()
      );
      const asClient = typed.filter(
        (o) => o.account.client.toBase58() === publicKey.toBase58()
      );

      setFreelancerOrders(asFreelancer);
      setClientOrders(asClient);
    } catch (err) {
      console.error("Error fetching orders:", err);
    } finally {
      setLoading(false);
    }
  }, [publicKey]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return { freelancerOrders, clientOrders, loading, refetch: fetchOrders };
}
