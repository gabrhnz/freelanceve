"use client";

import Link from "next/link";
import { PublicKey } from "@solana/web3.js";
import { formatUSDC } from "@/lib/utils";
import USDCBadge from "./USDCBadge";

interface ServiceData {
  titulo: string;
  descripcion?: string;
  precioUsdc: { toNumber: () => number };
  deliveryDays: number;
  categoria: string;
  activo: boolean;
  freelancer?: PublicKey | null;
  ordersCount?: number;
}

interface ServiceCardProps {
  service: ServiceData;
  publicKey?: PublicKey;
}

export default function ServiceCard({ service, publicKey }: ServiceCardProps) {
  const content = (
    <div className="group rounded-xl border border-gray-200 bg-white p-5 transition hover:border-ve-blue/30 hover:shadow-lg dark:border-gray-800 dark:bg-gray-900 dark:hover:border-ve-yellow/30">
      <div className="mb-3 flex items-center justify-between">
        <span className="rounded-full bg-ve-blue/10 px-2.5 py-0.5 text-xs font-medium text-ve-blue dark:text-ve-yellow">
          {service.categoria}
        </span>
        {service.activo ? (
          <span className="h-2 w-2 rounded-full bg-green-500" />
        ) : (
          <span className="h-2 w-2 rounded-full bg-gray-400" />
        )}
      </div>

      <h3 className="mb-1 text-lg font-bold text-gray-900 group-hover:text-ve-blue dark:text-white dark:group-hover:text-ve-yellow">
        {service.titulo}
      </h3>

      {service.descripcion && (
        <p className="mb-3 line-clamp-2 text-sm text-gray-500 dark:text-gray-400">
          {service.descripcion}
        </p>
      )}

      <div className="flex items-center justify-between border-t border-gray-100 pt-3 dark:border-gray-800">
        <USDCBadge amount={service.precioUsdc.toNumber()} compact />
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {service.deliveryDays} días
        </span>
      </div>
    </div>
  );

  if (publicKey) {
    return <Link href={`/services/${publicKey.toBase58()}`}>{content}</Link>;
  }

  return content;
}
