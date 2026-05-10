"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { CATEGORIES, SKILL_SUGGESTIONS } from "@/lib/constants";
import { Navigation } from "@/components/navigation";
import { useSession } from "@/contexts/session-context";
import { Briefcase, User, Users, ArrowRight, ArrowLeft, X, Plus, Mail, Wallet, Check } from "lucide-react";
import toast from "react-hot-toast";
import { upsertProfile, getProfileByEmail, getProfileByWallet, sendWelcomeMessage } from "@/lib/supabase";

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
  const { user, sendOTP, verifyOTP, updateProfile } = useSession();
  const router = useRouter();

  // Steps: 1=Email OTP, 2=Role, 3=Profile+Skills
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [role, setRole] = useState<Role | null>(null);
  const [nombre, setNombre] = useState("");
  const [bio, setBio] = useState("");
  const [categoria, setCategoria] = useState<string>(CATEGORIES[0]);
  const [skillInput, setSkillInput] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // If already logged in and has profile, go to dashboard
  useEffect(() => {
    async function checkExisting() {
      if (user?.email) {
        const p = await getProfileByEmail(user.email);
        if (p) {
          router.push("/dashboard");
          return;
        }
        // Has session but no profile — continue registration
        if (step === 1) setStep(2);
      } else if (publicKey) {
        const p = await getProfileByWallet(publicKey.toBase58());
        if (p) {
          router.push("/dashboard");
          return;
        }
        // Wallet connected but no profile — go straight to role selection
        if (step === 1) setStep(2);
      }
    }
    checkExisting();
  }, [user, publicKey, step, router]);

  const handleSendOTP = async () => {
    if (!email || !email.includes("@")) {
      toast.error("Ingresa un email válido");
      return;
    }
    setSendingOtp(true);
    const result = await sendOTP(email);
    setSendingOtp(false);
    if (result.success) {
      setOtpSent(true);
      toast.success("Código enviado a tu email");
    } else {
      toast.error(result.error || "Error al enviar código");
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all 6 digits entered
    if (newOtp.every((d) => d) && newOtp.join("").length === 6) {
      handleVerifyOTP(newOtp.join(""));
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 0) return;
    const newOtp = [...otp];
    for (let i = 0; i < pasted.length; i++) {
      newOtp[i] = pasted[i];
    }
    setOtp(newOtp);
    // Focus last filled or next empty
    const focusIdx = Math.min(pasted.length, 5);
    otpRefs.current[focusIdx]?.focus();
    // Auto-verify if full
    if (newOtp.every((d) => d) && newOtp.join("").length === 6) {
      handleVerifyOTP(newOtp.join(""));
    }
  };

  const handleVerifyOTP = async (code: string) => {
    setVerifyingOtp(true);
    const result = await verifyOTP(email, code);
    setVerifyingOtp(false);
    if (result.success) {
      // Check if profile already exists
      const existing = await getProfileByEmail(email);
      if (existing) {
        toast.success("¡Bienvenido de vuelta!");
        router.push("/dashboard");
        return;
      }
      toast.success("¡Verificado! Continúa tu registro");
      setStep(2);
    } else {
      toast.error(result.error || "Código inválido");
      setOtp(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
    }
  };

  const addSkills = (input: string) => {
    const parts = input.split(",");
    const last = parts.pop() || "";
    const newSkills = [...skills];
    for (const part of parts) {
      const trimmed = part.trim();
      if (trimmed && newSkills.length < 5 && !newSkills.includes(trimmed)) {
        newSkills.push(trimmed);
      }
    }
    setSkills(newSkills);
    setSkillInput(last);
  };

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
    if (!nombre.trim()) {
      toast.error("El nombre es requerido");
      return;
    }

    const userEmail = (user?.email && user.email.trim()) || (email && email.trim()) || null;
    const walletAddr = publicKey ? publicKey.toBase58() : null;

    if (!userEmail && !walletAddr) {
      toast.error("Necesitas un email o wallet para registrarte");
      return;
    }

    setLoading(true);
    try {
      // Save profile to Supabase
      const profile = await upsertProfile({
        ...(userEmail ? { email: userEmail } : {}),
        nombre: nombre.trim(),
        bio: bio.trim() || null,
        role: role || "freelancer",
        categoria: categoria || null,
        skills,
        ...(walletAddr ? { wallet_address: walletAddr } : {}),
      });

      if (!profile) {
        toast.error("Error al guardar perfil. Revisa la consola.");
        console.error("upsertProfile returned null. Payload:", {
          email: userEmail,
          wallet_address: walletAddr,
          nombre: nombre.trim(),
          role: role || "freelancer",
        });
        return;
      }

      // Send welcome message from the Wira team
      sendWelcomeMessage(profile.id).catch(console.error);

      // Update JWT session if we have one
      if (user) {
        await updateProfile({
          nombre,
          role: role || "freelancer",
          ...(publicKey && { walletAddress: publicKey.toBase58() }),
        });
      }

      toast.success("¡Perfil creado exitosamente!");
      router.push("/dashboard");
    } catch (err: unknown) {
      console.error(err);
      toast.error("Error al crear perfil");
    } finally {
      setLoading(false);
    }
  };

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
                {step > s ? <Check className="w-5 h-5" /> : s}
              </div>
              {s < 3 && (
                <div className={`w-12 h-1 rounded ${step > s ? "bg-black" : "bg-gray-200"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Email + OTP */}
        {step === 1 && (
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="text-[36px] md:text-[48px] font-bold leading-tight">
                Únete a <span className="bg-ve-yellow px-2">Wira</span>
              </h1>
              <p className="text-[#393939] text-[16px] font-medium mt-3 max-w-md mx-auto">
                Ingresa tu email para comenzar. Tu wallet la puedes conectar después.
              </p>
            </div>

            {!otpSent ? (
              <div className="bg-white border-4 border-black rounded-xl p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-5">
                <div>
                  <label className="block text-sm font-bold mb-2">
                    <Mail className="w-4 h-4 inline mr-1" /> Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    onKeyDown={(e) => e.key === "Enter" && handleSendOTP()}
                    className="w-full border-3 border-black rounded-lg px-4 py-3 text-[16px] font-medium placeholder:text-gray-400 focus:outline-none focus:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-shadow"
                  />
                </div>

                <button
                  onClick={handleSendOTP}
                  disabled={sendingOtp || !email.includes("@")}
                  className="w-full bg-black text-white border-4 border-black rounded-xl py-4 font-bold text-lg flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
                >
                  {sendingOtp ? (
                    <>
                      <span className="h-5 w-5 animate-spin rounded-full border-3 border-white border-t-transparent" />
                      Enviando...
                    </>
                  ) : (
                    <>Enviar código <ArrowRight className="w-5 h-5" /></>
                  )}
                </button>
              </div>
            ) : (
              <div className="bg-white border-4 border-black rounded-xl p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-5">
                <div className="text-center">
                  <p className="font-bold text-lg">Ingresa el código</p>
                  <p className="text-[#393939] text-sm mt-1">
                    Enviado a <span className="font-bold">{email}</span>
                  </p>
                </div>

                <div className="flex justify-center gap-3">
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => { otpRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      onPaste={handleOtpPaste}
                      className="w-12 h-14 border-4 border-black rounded-xl text-center text-[24px] font-bold bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] focus:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] focus:outline-none transition-all"
                    />
                  ))}
                </div>

                {verifyingOtp && (
                  <div className="flex justify-center">
                    <span className="h-6 w-6 animate-spin rounded-full border-3 border-black border-t-transparent" />
                  </div>
                )}

                <button
                  onClick={() => { setOtpSent(false); setOtp(["", "", "", "", "", ""]); }}
                  className="w-full text-center text-sm font-bold text-[#393939] hover:text-black"
                >
                  ← Cambiar email
                </button>
              </div>
            )}

            {/* Divider */}
            <div className="flex items-center gap-4">
              <div className="flex-1 h-[3px] bg-black/10 rounded" />
              <span className="text-sm font-bold text-[#393939]">o</span>
              <div className="flex-1 h-[3px] bg-black/10 rounded" />
            </div>

            {/* Wallet alternative */}
            <div className="text-center">
              <p className="text-sm text-[#393939] mb-3 font-medium">
                ¿Ya tienes wallet? Conéctala directamente
              </p>
              <div className="flex justify-center">
                <WalletMultiButton
                  style={{
                    backgroundColor: "#9945FF",
                    color: "white",
                    borderRadius: "0.75rem",
                    height: "48px",
                    fontSize: "16px",
                    fontWeight: 700,
                    padding: "0 32px",
                    border: "3px solid black",
                    boxShadow: "3px 3px 0px 0px rgba(0,0,0,1)",
                  }}
                />
              </div>
              {publicKey && (
                <p className="mt-3 text-sm font-bold text-[#9945FF] animate-pulse">
                  Wallet detectada, redirigiendo...
                </p>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Select role */}
        {step === 2 && (
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="text-[36px] md:text-[48px] font-bold leading-tight">
                Elige tu <span className="bg-ve-yellow px-2">rol</span>
              </h1>
              <p className="text-[#393939] text-[16px] font-medium mt-3 max-w-md mx-auto">
                Selecciona cómo quieres usar Wira
              </p>
            </div>

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

            <div className="flex gap-4">
              <button
                onClick={() => setStep(1)}
                className="flex-1 bg-white text-black border-4 border-black rounded-xl py-4 font-bold text-lg flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all"
              >
                <ArrowLeft className="w-5 h-5" /> Atrás
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!role}
                className="flex-1 bg-black text-white border-4 border-black rounded-xl py-4 font-bold text-lg flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
              >
                Continuar <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Profile + Skills + Optional wallet */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-[36px] md:text-[48px] font-bold leading-tight">
                Tu <span className="bg-[#FF6B7A] text-white px-2">perfil</span>
              </h1>
              <p className="text-[#393939] text-[16px] font-medium mt-3">
                Completa tu información para empezar
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
                  placeholder="Cuéntanos sobre ti..."
                  className="w-full border-3 border-black rounded-lg px-4 py-3 text-[16px] font-medium placeholder:text-gray-400 focus:outline-none focus:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-shadow resize-none"
                />
                <p className="mt-1 text-xs text-gray-400 text-right">{bio.length}/200</p>
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">Categoría</label>
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

              {/* Skills */}
              <div>
                <label className="block text-sm font-bold mb-2">Skills (máx. 5)</label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={skillInput}
                      onChange={(e) => addSkills(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                      maxLength={30}
                      placeholder="Ej: Rust, Anchor, React..."
                      className="w-full border-3 border-black rounded-lg px-4 py-3 text-[16px] font-medium placeholder:text-gray-400 focus:outline-none focus:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-shadow"
                    />
                    {skillInput.trim() && skills.length < 5 && (
                      <div className="absolute z-10 left-0 right-0 top-full mt-1 bg-white border-3 border-black rounded-lg shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] max-h-40 overflow-y-auto">
                        {SKILL_SUGGESTIONS
                          .filter(s => s.toLowerCase().includes(skillInput.toLowerCase()) && !skills.includes(s))
                          .slice(0, 6)
                          .map(s => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => { setSkills([...skills, s]); setSkillInput(""); }}
                              className="w-full text-left px-4 py-2 text-sm font-medium hover:bg-ve-yellow/30 transition-colors"
                            >
                              {s}
                            </button>
                          ))}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={addSkill}
                    disabled={skills.length >= 5 || !skillInput.trim()}
                    className="bg-black text-white border-3 border-black rounded-lg px-4 font-bold disabled:opacity-30 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-shadow"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                {skills.length < 5 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {["Rust", "Anchor", "React", "Solana Programs", "TypeScript", "DeFi", "NFT Collections", "UI/UX Design"]
                      .filter(s => !skills.includes(s))
                      .map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => skills.length < 5 && setSkills([...skills, s])}
                        className="text-xs font-bold text-[#393939] bg-[#F5F5F5] border-2 border-black/10 rounded-lg px-2.5 py-1 hover:bg-ve-yellow/20 hover:border-black/30 transition-all"
                      >
                        + {s}
                      </button>
                    ))}
                  </div>
                )}
                <div className="mt-2 flex flex-wrap gap-2 min-h-[32px]">
                  {skills.map((s) => (
                    <span
                      key={s}
                      className="inline-flex items-center gap-2 bg-ve-yellow border-3 border-black rounded-lg px-4 py-2 font-bold text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    >
                      {s}
                      <button type="button" onClick={() => removeSkill(s)} className="hover:text-ve-red transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Optional: Connect wallet */}
            <div className="bg-[#F5F5F5] border-4 border-black/10 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-[#393939]" />
                <p className="text-sm font-bold text-[#393939]">Wallet de Solana (opcional)</p>
              </div>
              {publicKey ? (
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="font-mono text-sm">{publicKey.toBase58().slice(0, 6)}...{publicKey.toBase58().slice(-4)}</span>
                  <span className="text-xs bg-ve-yellow border-2 border-black rounded px-2 py-0.5 font-bold">Conectada</span>
                </div>
              ) : (
                <div>
                  <p className="text-xs text-[#393939] mb-2">Puedes conectarla ahora o después desde tu dashboard.</p>
                  <WalletMultiButton
                    style={{
                      backgroundColor: "#9945FF",
                      color: "white",
                      borderRadius: "0.5rem",
                      height: "40px",
                      fontSize: "14px",
                      fontWeight: 700,
                      padding: "0 20px",
                      border: "2px solid black",
                    }}
                  />
                </div>
              )}
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStep(2)}
                className="flex-1 bg-white text-black border-4 border-black rounded-xl py-4 font-bold text-lg flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all"
              >
                <ArrowLeft className="w-5 h-5" /> Atrás
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || !nombre.trim()}
                className="flex-1 bg-[#9945FF] text-white border-4 border-black rounded-xl py-4 font-bold text-lg flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
              >
                {loading ? (
                  <>
                    <span className="h-5 w-5 animate-spin rounded-full border-3 border-white border-t-transparent" />
                    Creando...
                  </>
                ) : (
                  "Crear cuenta"
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
