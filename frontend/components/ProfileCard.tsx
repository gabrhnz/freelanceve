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
    <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-3 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-ve-blue to-ve-red text-lg font-bold text-white">
          {profile.nombre.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="font-bold dark:text-white">{profile.nombre}</p>
          <p className="text-xs text-gray-500">
            {shortWallet(profile.owner.toBase58())}
          </p>
        </div>
      </div>

      <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">
        {profile.bio}
      </p>

      <div className="flex flex-wrap gap-1.5">
        {profile.skills.map((s) => (
          <span
            key={s}
            className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300"
          >
            {s}
          </span>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-gray-100 pt-3 dark:border-gray-800">
        <div className="text-center">
          <p className="text-sm font-bold text-ve-blue dark:text-ve-yellow">
            {profile.jobsCompleted}
          </p>
          <p className="text-[10px] text-gray-500">Trabajos</p>
        </div>
        <div className="text-center">
          <p className="text-sm font-bold text-ve-blue dark:text-ve-yellow">
            {formatUSDC(profile.totalEarned.toNumber())}
          </p>
          <p className="text-[10px] text-gray-500">Ganado</p>
        </div>
        <div className="text-center">
          <p className="text-sm font-bold dark:text-white">
            {profile.rating || "—"}
          </p>
          <p className="text-[10px] text-gray-500">Rating</p>
        </div>
      </div>
    </div>
  );
}
