"use client";

import { useEffect, useState, useCallback } from "react";
import { PublicKey } from "@solana/web3.js";
import { getReadonlyProgram } from "@/lib/anchor";

export interface ServiceAccountData {
  freelancer: PublicKey;
  titulo: string;
  descripcion: string;
  precioUsdc: { toNumber: () => number };
  deliveryDays: number;
  categoria: string;
  activo: boolean;
  ordersCount: number;
  createdAt: { toNumber: () => number };
  bump: number;
}

export interface ServiceWithKey {
  publicKey: PublicKey;
  account: ServiceAccountData;
}

export function useServices() {
  const [services, setServices] = useState<ServiceWithKey[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchServices = useCallback(async () => {
    try {
      const program = getReadonlyProgram();
      const allServices = await program.account.serviceListing.all();
      const active = allServices.filter((s) => s.account.activo);
      setServices(active as unknown as ServiceWithKey[]);
    } catch (err) {
      console.error("Error fetching services:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  return { services, loading, refetch: fetchServices };
}
