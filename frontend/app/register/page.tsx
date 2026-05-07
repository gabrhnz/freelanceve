"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWallet, useAnchorWallet } from "@solana/wallet-adapter-react";
import { getProgram, findProfilePDA } from "@/lib/anchor";
import { CATEGORIES } from "@/lib/constants";
import toast from "react-hot-toast";

export default function RegisterPage() {
  const { publicKey } = useWallet();
  const wallet = useAnchorWallet();
  const router = useRouter();

  const [nombre, setNombre] = useState("");
  const [bio, setBio] = useState("");
  const [categoria, setCategoria] = useState<string>(CATEGORIES[0]);
  const [skillInput, setSkillInput] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!publicKey || !wallet) {
      setChecking(false);
      return;
    }
    const checkProfile = async () => {
      try {
        const program = getProgram(wallet);
        const [profilePDA] = findProfilePDA(publicKey);
        await program.account.freelancerProfile.fetch(profilePDA);
        router.push("/dashboard");
      } catch {
        setChecking(false);
      }
    };
    checkProfile();
  }, [publicKey, wallet, router]);

  const addSkill = () => {
    const trimmed = skillInput.trim();
    if (trimmed && skills.length < 5 && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
      setSkillInput("");
    }
  };

  const removeSkill = (s: string) => {
    setSkills(skills.filter((sk) => sk !== s));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wallet || !publicKey) {
      toast.error("Conecta tu wallet primero");
      return;
    }
    if (!nombre.trim()) {
      toast.error("El nombre es requerido");
      return;
    }

    setLoading(true);
    try {
      const program = getProgram(wallet);
      const [profilePDA] = findProfilePDA(publicKey);

      await program.methods
        .registerFreelancer(nombre, bio, categoria, skills)
        .accounts({
          profile: profilePDA,
          owner: publicKey,
        })
        .rpc();

      toast.success("¡Perfil registrado exitosamente!");
      router.push("/dashboard");
    } catch (err: unknown) {
      console.error(err);
      toast.error(
        err instanceof Error ? err.message : "Error al registrar perfil"
      );
    } finally {
      setLoading(false);
    }
  };

  if (!publicKey) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold dark:text-white">
            Conecta tu wallet
          </h2>
          <p className="mt-2 text-gray-500">
            Necesitas conectar tu wallet de Solana para registrarte como
            freelancer.
          </p>
        </div>
      </div>
    );
  }

  if (checking) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-ve-blue border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-2 text-3xl font-extrabold dark:text-white">
        Regístrate como Freelancer
      </h1>
      <p className="mb-8 text-gray-500 dark:text-gray-400">
        Crea tu perfil on-chain y empieza a ofrecer tus servicios.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Nombre */}
        <div>
          <label className="mb-1 block text-sm font-semibold dark:text-gray-200">
            Nombre <span className="text-ve-red">*</span>
          </label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            maxLength={50}
            placeholder="Tu nombre profesional"
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          />
          <p className="mt-1 text-xs text-gray-400">{nombre.length}/50</p>
        </div>

        {/* Bio */}
        <div>
          <label className="mb-1 block text-sm font-semibold dark:text-gray-200">
            Bio
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={200}
            rows={3}
            placeholder="Cuéntanos sobre ti..."
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          />
          <p className="mt-1 text-xs text-gray-400">{bio.length}/200</p>
        </div>

        {/* Categoría */}
        <div>
          <label className="mb-1 block text-sm font-semibold dark:text-gray-200">
            Categoría
          </label>
          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Skills */}
        <div>
          <label className="mb-1 block text-sm font-semibold dark:text-gray-200">
            Skills (máx. 5)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
              maxLength={30}
              placeholder="Añadir skill..."
              className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            />
            <button
              type="button"
              onClick={addSkill}
              disabled={skills.length >= 5}
              className="rounded-lg bg-ve-blue px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              +
            </button>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {skills.map((s) => (
              <span
                key={s}
                className="inline-flex items-center gap-1 rounded-full bg-ve-yellow/20 px-3 py-1 text-xs font-medium text-ve-blue dark:text-ve-yellow"
              >
                {s}
                <button
                  type="button"
                  onClick={() => removeSkill(s)}
                  className="text-ve-red hover:text-red-700"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || !nombre.trim()}
          className="w-full rounded-xl bg-ve-blue py-3 font-bold text-white shadow-lg transition hover:bg-ve-blue/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Registrando...
            </span>
          ) : (
            "Registrar Perfil On-Chain"
          )}
        </button>
      </form>
    </div>
  );
}
