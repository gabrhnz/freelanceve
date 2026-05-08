"use client";

import { useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { useAnchorWallet, useWallet } from "@solana/wallet-adapter-react";
import { getProgram, findProfilePDA, findEscrowAuthorityPDA, findEscrowTokenPDA } from "@/lib/anchor";
import { USDC_MINT_DEVNET } from "@/lib/constants";
import { formatUSDC, shortWallet, statusLabel, statusColor, timeRemaining } from "@/lib/utils";
import toast from "react-hot-toast";
import { getAssociatedTokenAddress } from "@solana/spl-token";

interface OrderData {
  client: PublicKey;
  freelancer: PublicKey;
  service: PublicKey;
  amount: { toNumber: () => number };
  status: { inProgress?: object; delivered?: object; completed?: object; refunded?: object };
  deadline: { toNumber: () => number };
  createdAt: { toNumber: () => number };
  bump: number;
}

interface OrderCardProps {
  order: OrderData;
  orderKey: PublicKey;
  role: "freelancer" | "client";
}

export default function OrderCard({ order, orderKey, role }: OrderCardProps) {
  const wallet = useAnchorWallet();
  const { publicKey } = useWallet();
  const [loading, setLoading] = useState(false);

  const label = statusLabel(order.status);
  const color = statusColor(order.status);
  const deadline = order.deadline.toNumber();
  const remaining = timeRemaining(deadline);

  const handleDeliver = async () => {
    if (!wallet || !publicKey) return;
    setLoading(true);
    try {
      const program = getProgram(wallet);
      await program.methods
        .deliverOrder()
        .accounts({
          order: orderKey,
          freelancer: publicKey,
        })
        .rpc();
      toast.success("Orden marcada como entregada");
      window.location.reload();
    } catch (err: unknown) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Error al entregar");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!wallet || !publicKey) return;
    setLoading(true);
    try {
      const program = getProgram(wallet);
      const [escrowAuthority] = findEscrowAuthorityPDA(orderKey);
      const [escrowToken] = findEscrowTokenPDA(orderKey);
      const [freelancerProfile] = findProfilePDA(order.freelancer);

      const freelancerUsdc = await getAssociatedTokenAddress(
        USDC_MINT_DEVNET,
        order.freelancer
      );

      await program.methods
        .approveOrder()
        .accounts({
          order: orderKey,
          escrowUsdc: escrowToken,
          escrowAuthority: escrowAuthority,
          freelancerUsdc: freelancerUsdc,
          freelancerProfile: freelancerProfile,
          client: publicKey,
          tokenProgram: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
        })
        .rpc();
      toast.success("¡Trabajo aprobado! USDC liberado al freelancer.");
      window.location.reload();
    } catch (err: unknown) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Error al aprobar");
    } finally {
      setLoading(false);
    }
  };

  const handleRefund = async () => {
    if (!wallet || !publicKey) return;
    setLoading(true);
    try {
      const program = getProgram(wallet);
      const [escrowAuthority] = findEscrowAuthorityPDA(orderKey);
      const [escrowToken] = findEscrowTokenPDA(orderKey);

      const clientUsdc = await getAssociatedTokenAddress(
        USDC_MINT_DEVNET,
        order.client
      );

      await program.methods
        .refundOrder()
        .accounts({
          order: orderKey,
          escrowUsdc: escrowToken,
          escrowAuthority: escrowAuthority,
          clientUsdc: clientUsdc,
          signer: publicKey,
          tokenProgram: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
        })
        .rpc();
      toast.success("Reembolso procesado exitosamente");
      window.location.reload();
    } catch (err: unknown) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Error al reembolsar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border-4 border-black rounded-xl p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
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

        <div className="flex gap-2">
          {role === "freelancer" && label === "En Progreso" && (
            <button
              onClick={handleDeliver}
              disabled={loading}
              className="bg-ve-yellow border-3 border-black rounded-lg px-4 py-1.5 text-xs font-bold hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-shadow disabled:opacity-50"
            >
              {loading ? "..." : "Marcar Entregado"}
            </button>
          )}
          {role === "client" && label === "Entregado" && (
            <button
              onClick={handleApprove}
              disabled={loading}
              className="bg-black text-white border-3 border-black rounded-lg px-4 py-1.5 text-xs font-bold hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-shadow disabled:opacity-50"
            >
              {loading ? "..." : "Aprobar Trabajo"}
            </button>
          )}
          {(label === "En Progreso" || label === "Entregado") &&
            remaining === "Vencido" && (
              <button
                onClick={handleRefund}
                disabled={loading}
                className="bg-ve-red text-white border-3 border-black rounded-lg px-4 py-1.5 text-xs font-bold hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-shadow disabled:opacity-50"
              >
                {loading ? "..." : "Reembolsar"}
              </button>
            )}
        </div>
      </div>
    </div>
  );
}
