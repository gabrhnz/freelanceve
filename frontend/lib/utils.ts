import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatUSDC(microUsdc: number): string {
  const usdc = microUsdc / 1_000_000;
  return `$${usdc.toFixed(2)} USDC`;
}

export function shortWallet(wallet: string): string {
  if (!wallet || wallet.length < 8) return wallet;
  return `${wallet.slice(0, 4)}...${wallet.slice(-4)}`;
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString("es-VE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function timeRemaining(deadline: number): string {
  const now = Math.floor(Date.now() / 1000);
  const diff = deadline - now;

  if (diff <= 0) return "Vencido";

  const days = Math.floor(diff / 86400);
  const hours = Math.floor((diff % 86400) / 3600);

  if (days > 0) return `${days}d ${hours}h restantes`;
  const minutes = Math.floor((diff % 3600) / 60);
  return `${hours}h ${minutes}m restantes`;
}

export function statusLabel(
  status: { inProgress?: object; delivered?: object; completed?: object; refunded?: object } | string
): string {
  if (typeof status === "string") return status;
  if ("inProgress" in status) return "En Progreso";
  if ("delivered" in status) return "Entregado";
  if ("completed" in status) return "Completado";
  if ("refunded" in status) return "Reembolsado";
  return "Desconocido";
}

export function statusColor(
  status: { inProgress?: object; delivered?: object; completed?: object; refunded?: object } | string
): string {
  const label = statusLabel(status);
  switch (label) {
    case "En Progreso":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
    case "Entregado":
      return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
    case "Completado":
      return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
    case "Reembolsado":
      return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
    default:
      return "bg-gray-100 text-gray-500";
  }
}
