"use client";

import { useEffect, useState, useCallback } from "react";
import { PublicKey } from "@solana/web3.js";
import { useWallet, useAnchorWallet } from "@solana/wallet-adapter-react";
import { getProgram, findProfilePDA } from "@/lib/anchor";

export interface FreelancerProfileData {
  owner: PublicKey;
  nombre: string;
  bio: string;
  categoria: string;
  skills: string[];
  jobsCompleted: number;
  totalEarned: { toNumber: () => number };
  rating: number;
  serviceCount: number;
  createdAt: { toNumber: () => number };
  bump: number;
}

export function useFreelancerProfile() {
  const { publicKey } = useWallet();
  const wallet = useAnchorWallet();
  const [profile, setProfile] = useState<FreelancerProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!publicKey || !wallet) {
      setLoading(false);
      return;
    }
    try {
      const program = getProgram(wallet);
      const [profilePDA] = findProfilePDA(publicKey);
      const data = await program.account.freelancerProfile.fetch(profilePDA);
      setProfile(data as unknown as FreelancerProfileData);
    } catch {
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [publicKey, wallet]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return { profile, loading, refetch: fetchProfile };
}
