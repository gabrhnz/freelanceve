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
    <div className="group bg-white border-4 border-black rounded-xl p-5 transition-all hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
      <div className="mb-3 flex items-center justify-between">
        <span className="bg-ve-blue text-white border-2 border-black rounded-lg px-2.5 py-0.5 text-xs font-bold">
          {service.categoria}
        </span>
        <span className={`rounded-lg px-2 py-0.5 text-[10px] font-bold border-2 border-black ${
          service.activo ? "bg-ve-yellow" : "bg-gray-200 text-gray-500"
        }`}>
          {service.activo ? "Activo" : "Pausado"}
        </span>
      </div>

      <h3 className="mb-1 text-lg font-bold">
        {service.titulo}
      </h3>

      {service.descripcion && (
        <p className="mb-3 line-clamp-2 text-sm text-[#393939] font-medium">
          {service.descripcion}
        </p>
      )}

      <div className="flex items-center justify-between border-t-3 border-black/10 pt-3">
        <USDCBadge amount={service.precioUsdc.toNumber()} compact />
        <span className="text-xs font-bold text-[#393939]">
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
