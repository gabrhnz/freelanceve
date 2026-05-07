"use client";

import { useEffect, useState } from "react";

interface USDCBadgeProps {
  amount: number; // micro-USDC
  compact?: boolean;
}

export default function USDCBadge({ amount, compact = false }: USDCBadgeProps) {
  const [vesRate, setVesRate] = useState<number | null>(null);
  const usdc = amount / 1_000_000;

  useEffect(() => {
    const fetchRate = async () => {
      try {
        const res = await fetch(
          "https://open.er-api.com/v6/latest/USD"
        );
        const data = await res.json();
        if (data.rates?.VES) {
          setVesRate(data.rates.VES);
        }
      } catch {
        // silently fail
      }
    };
    fetchRate();
  }, []);

  if (compact) {
    return (
      <span className="text-sm font-bold text-ve-blue dark:text-ve-yellow">
        ${usdc.toFixed(2)} USDC
      </span>
    );
  }

  return (
    <div>
      <p className="text-lg font-bold text-ve-blue dark:text-ve-yellow">
        ${usdc.toFixed(2)} USDC
      </p>
      {vesRate && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          ≈ Bs.S {(usdc * vesRate).toFixed(2)}
        </p>
      )}
    </div>
  );
}
