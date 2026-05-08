"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWallet, useAnchorWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { getProgram, findProfilePDA } from "@/lib/anchor";
import { CATEGORIES } from "@/lib/constants";
import { Navigation } from "@/components/navigation";
import { Briefcase, User, Users, ArrowRight, ArrowLeft, X, Plus } from "lucide-react";
import toast from "react-hot-toast";

type Role = "freelancer" | "employer" | "both";

const ROLES: { id: Role; icon: React.ReactNode; title: string; description: string; color: string }[] = [
  {
    id: "freelancer",
    icon: <Briefcase className="w-8 h-8" />,
    title: "Freelancer",
    description: "Ofrece tus servicios y recibe pagos en USDC",
    color: "bg-[#9945FF]",
  },
  {
    id: "employer",
    icon: <User className="w-8 h-8" />,
    title: "Empleador",
    description: "Contrata talento y paga de forma segura con escrow",
    color: "bg-ve-blue",
  },
  {
    id: "both",
    icon: <Users className="w-8 h-8" />,
    title: "Ambos",
    description: "Ofrece servicios y contrata talento al mismo tiempo",
    color: "bg-ve-red",
  },
];

export default function RegisterPage() {
  const { publicKey } = useWallet();
  const wallet = useAnchorWallet();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [role, setRole] = useState<Role | null>(null);
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

  const handleSubmit = async () => {
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

      toast.success("Perfil registrado exitosamente!");
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

  if (checking) {
    return (
      <>
        <Navigation />
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-black border-t-transparent" />
        </div>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-3 mb-10">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full border-3 border-black flex items-center justify-center font-bold text-sm transition-all ${
                  step >= s
                    ? "bg-black text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
                    : "bg-white text-black"
                }`}
              >
                {s}
              </div>
              {s < 3 && (
                <div className={`w-12 h-1 rounded ${step > s ? "bg-black" : "bg-gray-200"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Connect wallet + Select role */}
        {step === 1 && (
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="text-[36px] md:text-[48px] font-bold leading-tight">
                Elige tu <span className="bg-ve-yellow px-2">rol</span>
              </h1>
              <p className="text-[#393939] text-[16px] font-medium mt-3 max-w-md mx-auto">
                Selecciona cmo quieres usar SolanceWork
              </p>
            </div>

            {/* Wallet connect prompt */}
            {!publicKey && (
              <div className="bg-[#F5F5F5] border-4 border-black rounded-xl p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-center">
                <p className="font-bold text-lg mb-4">Conecta tu wallet para continuar</p>
                <div className="flex justify-center">
                  <WalletMultiButton
                    style={{
                      backgroundColor: "#0B0B0B",
                      color: "white",
                      borderRadius: "0.5rem",
                      height: "48px",
                      fontSize: "16px",
                      fontWeight: 700,
                      padding: "0 32px",
                      border: "3px solid black",
                    }}
                  />
                </div>
              </div>
            )}

            {/* Role cards */}
            <div className="grid gap-4">
              {ROLES.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setRole(r.id)}
                  className={`flex items-center gap-5 p-5 bg-white border-4 rounded-xl text-left transition-all ${
                    role === r.id
                      ? "border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] scale-[1.02]"
                      : "border-black/20 hover:border-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                  }`}
                >
                  <div className={`${r.color} w-14 h-14 rounded-xl flex items-center justify-center text-white border-3 border-black shrink-0`}>
                    {r.icon}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-lg">{r.title}</p>
                    <p className="text-[#393939] text-sm">{r.description}</p>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-3 border-black flex items-center justify-center shrink-0 ${
                    role === r.id ? "bg-black" : "bg-white"
                  }`}>
                    {role === r.id && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!role || !publicKey}
              className="w-full bg-black text-white border-4 border-black rounded-xl py-4 font-bold text-lg flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
            >
              Continuar <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Step 2: Profile details */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-[36px] md:text-[48px] font-bold leading-tight">
                Tu <span className="bg-[#FF6B7A] text-white px-2">perfil</span>
              </h1>
              <p className="text-[#393939] text-[16px] font-medium mt-3">
                Informacin bsica para tu perfil on-chain
              </p>
            </div>

            <div className="bg-white border-4 border-black rounded-xl p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-5">
              <div>
                <label className="block text-sm font-bold mb-2">
                  Nombre <span className="text-ve-red">*</span>
                </label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  maxLength={50}
                  placeholder="Tu nombre profesional"
                  className="w-full border-3 border-black rounded-lg px-4 py-3 text-[16px] font-medium placeholder:text-gray-400 focus:outline-none focus:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-shadow"
                />
                <p className="mt-1 text-xs text-gray-400 text-right">{nombre.length}/50</p>
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={200}
                  rows={3}
                  placeholder="Cuntanos sobre ti..."
                  className="w-full border-3 border-black rounded-lg px-4 py-3 text-[16px] font-medium placeholder:text-gray-400 focus:outline-none focus:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-shadow resize-none"
                />
                <p className="mt-1 text-xs text-gray-400 text-right">{bio.length}/200</p>
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">Categora</label>
                <select
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  className="w-full border-3 border-black rounded-lg px-4 py-3 text-[16px] font-medium bg-white focus:outline-none focus:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-shadow"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStep(1)}
                className="flex-1 bg-white text-black border-4 border-black rounded-xl py-4 font-bold text-lg flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all"
              >
                <ArrowLeft className="w-5 h-5" /> Atrs
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!nombre.trim()}
                className="flex-1 bg-black text-white border-4 border-black rounded-xl py-4 font-bold text-lg flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
              >
                Continuar <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Skills + Submit */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-[36px] md:text-[48px] font-bold leading-tight">
                Tus <span className="bg-[#2775CA] text-white px-2">skills</span>
              </h1>
              <p className="text-[#393939] text-[16px] font-medium mt-3">
                Aade hasta 5 habilidades para que te encuentren
              </p>
            </div>

            <div className="bg-white border-4 border-black rounded-xl p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-5">
              <div>
                <label className="block text-sm font-bold mb-2">Skills (mx. 5)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                    maxLength={30}
                    placeholder="Ej: React, Solidity, Diseo UI..."
                    className="flex-1 border-3 border-black rounded-lg px-4 py-3 text-[16px] font-medium placeholder:text-gray-400 focus:outline-none focus:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-shadow"
                  />
                  <button
                    type="button"
                    onClick={addSkill}
                    disabled={skills.length >= 5 || !skillInput.trim()}
                    className="bg-black text-white border-3 border-black rounded-lg px-4 font-bold disabled:opacity-30 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-shadow"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 min-h-[40px]">
                {skills.length === 0 && (
                  <p className="text-gray-400 text-sm">Aade tus habilidades arriba...</p>
                )}
                {skills.map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center gap-2 bg-ve-yellow border-3 border-black rounded-lg px-4 py-2 font-bold text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  >
                    {s}
                    <button
                      type="button"
                      onClick={() => removeSkill(s)}
                      className="hover:text-ve-red transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </span>
                ))}
              </div>

              {/* Summary */}
              <div className="border-t-3 border-black/10 pt-5 space-y-2">
                <p className="text-sm font-bold text-gray-500">Resumen</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#F5F5F5] rounded-lg p-3 border-2 border-black/10">
                    <p className="text-xs text-gray-500">Rol</p>
                    <p className="font-bold capitalize">{role === "both" ? "Ambos" : role === "employer" ? "Empleador" : "Freelancer"}</p>
                  </div>
                  <div className="bg-[#F5F5F5] rounded-lg p-3 border-2 border-black/10">
                    <p className="text-xs text-gray-500">Nombre</p>
                    <p className="font-bold truncate">{nombre}</p>
                  </div>
                  <div className="bg-[#F5F5F5] rounded-lg p-3 border-2 border-black/10">
                    <p className="text-xs text-gray-500">Categora</p>
                    <p className="font-bold text-sm">{categoria}</p>
                  </div>
                  <div className="bg-[#F5F5F5] rounded-lg p-3 border-2 border-black/10">
                    <p className="text-xs text-gray-500">Skills</p>
                    <p className="font-bold">{skills.length}/5</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStep(2)}
                className="flex-1 bg-white text-black border-4 border-black rounded-xl py-4 font-bold text-lg flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all"
              >
                <ArrowLeft className="w-5 h-5" /> Atrs
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || !nombre.trim()}
                className="flex-1 bg-[#9945FF] text-white border-4 border-black rounded-xl py-4 font-bold text-lg flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
              >
                {loading ? (
                  <>
                    <span className="h-5 w-5 animate-spin rounded-full border-3 border-white border-t-transparent" />
                    Registrando...
                  </>
                ) : (
                  "Registrar On-Chain"
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
