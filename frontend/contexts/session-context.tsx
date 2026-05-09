"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { getProfileByEmail, getProfileByWallet, updateProfileById, Profile } from "@/lib/supabase";

interface SessionUser {
  email: string;
  role?: string;
  nombre?: string;
  walletAddress?: string;
  profileId?: string;
}

interface SessionContextType {
  user: SessionUser | null;
  profile: Profile | null;
  loading: boolean;
  sendOTP: (email: string) => Promise<{ success: boolean; error?: string }>;
  verifyOTP: (email: string, code: string) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (data: { nombre?: string; role?: string; walletAddress?: string }) => Promise<void>;
  logout: () => Promise<void>;
  refetch: () => Promise<void>;
}

const SessionContext = createContext<SessionContextType>({
  user: null,
  profile: null,
  loading: true,
  sendOTP: async () => ({ success: false }),
  verifyOTP: async () => ({ success: false }),
  updateProfile: async () => {},
  logout: async () => {},
  refetch: async () => {},
});

export function SessionProvider({ children }: { children: ReactNode }) {
  const { publicKey, connected } = useWallet();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const prevWalletRef = useRef<string | null>(null);
  const emailSessionRef = useRef<{ email: string; profileId: string } | null>(null);

  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/session");
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
        // Load Supabase profile by email
        const p = await getProfileByEmail(data.user.email);
        setProfile(p);
        if (p) {
          emailSessionRef.current = { email: data.user.email, profileId: p.id };
          setUser((prev) => prev ? {
            ...prev,
            nombre: p.nombre,
            role: p.role,
            walletAddress: p.wallet_address || undefined,
            profileId: p.id,
          } : prev);
        } else {
          emailSessionRef.current = { email: data.user.email, profileId: "" };
        }
      } else {
        emailSessionRef.current = null;
        setUser(null);
        setProfile(null);
      }
    } catch {
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  // Watch wallet changes: load profile for the connected wallet
  // This handles: wallet-only users, wallet switches, and linking wallet to email profile
  useEffect(() => {
    const currentWallet = publicKey?.toBase58() || null;

    // Skip if wallet hasn't changed
    if (currentWallet === prevWalletRef.current) return;
    prevWalletRef.current = currentWallet;

    if (!currentWallet) {
      // Wallet disconnected — if no email session, clear profile
      if (!emailSessionRef.current?.email) {
        setProfile(null);
        setUser(null);
      }
      return;
    }

    // Wallet connected or changed — look up this wallet's profile
    (async () => {
      const walletProfile = await getProfileByWallet(currentWallet);
      if (walletProfile) {
        // This wallet has an existing profile — switch to it
        setProfile(walletProfile);
        setUser({
          email: walletProfile.email || "",
          nombre: walletProfile.nombre,
          role: walletProfile.role,
          walletAddress: currentWallet,
          profileId: walletProfile.id,
        });
      } else if (emailSessionRef.current?.email && emailSessionRef.current.profileId) {
        // Email session active, wallet not linked yet — auto-link wallet to this profile
        await updateProfileById(emailSessionRef.current.profileId, { wallet_address: currentWallet });
        setUser((prev) => prev ? { ...prev, walletAddress: currentWallet } : prev);
        setProfile((prev) => prev ? { ...prev, wallet_address: currentWallet } : prev);
      } else {
        // No profile for this wallet and no email session — user is unregistered
        setProfile(null);
        setUser(null);
      }
      setLoading(false);
    })();
  }, [publicKey, connected]);

  const sendOTP = async (email: string) => {
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error };
      return { success: true };
    } catch {
      return { success: false, error: "Error de conexión" };
    }
  };

  const verifyOTP = async (email: string, code: string) => {
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error };
      await fetchSession();
      return { success: true };
    } catch {
      return { success: false, error: "Error de conexión" };
    }
  };

  const updateProfile = async (data: { nombre?: string; role?: string; walletAddress?: string }) => {
    const res = await fetch("/api/auth/update-profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const result = await res.json();
      setUser(result.user);
    }
  };

  const logout = async () => {
    await fetch("/api/auth/session", { method: "DELETE" });
    setUser(null);
    setProfile(null);
  };

  return (
    <SessionContext.Provider value={{ user, profile, loading, sendOTP, verifyOTP, updateProfile, logout, refetch: fetchSession }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  return useContext(SessionContext);
}
