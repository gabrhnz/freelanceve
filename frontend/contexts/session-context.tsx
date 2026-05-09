"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { getProfileByEmail, Profile } from "@/lib/supabase";

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
  const [user, setUser] = useState<SessionUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/session");
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
        // Load Supabase profile
        const p = await getProfileByEmail(data.user.email);
        setProfile(p);
        if (p) {
          setUser((prev) => prev ? {
            ...prev,
            nombre: p.nombre,
            role: p.role,
            walletAddress: p.wallet_address || undefined,
            profileId: p.id,
          } : prev);
        }
      } else {
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
