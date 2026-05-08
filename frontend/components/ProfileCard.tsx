"use client";

import { PublicKey } from "@solana/web3.js";
import { formatUSDC, shortWallet } from "@/lib/utils";

interface ProfileData {
  owner: PublicKey;
  nombre: string;
  bio: string;
  categoria: string;
  skills: string[];
  jobsCompleted: number;
  totalEarned: { toNumber: () => number };
  rating: number;
}

interface ProfileCardProps {
  profile: ProfileData;
}

export default function ProfileCard({ profile }: ProfileCardProps) {
  return (
    <div className="bg-white border-4 border-black rounded-xl p-5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
      <div className="mb-3 flex items-center gap-3">
        <div className="w-12 h-12 bg-[#9945FF] rounded-xl border-3 border-black flex items-center justify-center text-lg font-bold text-white">
          {profile.nombre.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="font-bold">{profile.nombre}</p>
          <p className="text-xs font-mono text-[#393939]">
            {shortWallet(profile.owner.toBase58())}
          </p>
        </div>
      </div>

      <p className="mb-3 text-sm text-[#393939] font-medium">
        {profile.bio}
      </p>

      <div className="flex flex-wrap gap-1.5">
        {profile.skills.map((s) => (
          <span
            key={s}
            className="bg-ve-yellow border-2 border-black rounded-lg px-2 py-0.5 text-[10px] font-bold shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
          >
            {s}
          </span>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 border-t-3 border-black/10 pt-3">
        <div className="text-center">
          <p className="text-sm font-bold">{profile.jobsCompleted}</p>
          <p className="text-[10px] font-bold text-[#393939]">Trabajos</p>
        </div>
        <div className="text-center">
          <p className="text-sm font-bold">{formatUSDC(profile.totalEarned.toNumber())}</p>
          <p className="text-[10px] font-bold text-[#393939]">Ganado</p>
        </div>
        <div className="text-center">
          <p className="text-sm font-bold">{profile.rating || "—"}</p>
          <p className="text-[10px] font-bold text-[#393939]">Rating</p>
        </div>
      </div>
    </div>
  );
}
