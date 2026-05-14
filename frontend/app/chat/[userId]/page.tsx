"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useWallet, useAnchorWallet } from "@solana/wallet-adapter-react";
import { AnchorProvider } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { useSession } from "@/contexts/session-context";
import { Navigation } from "@/components/navigation";
import { getConnection, placeOrderOnChain, findOnChainService, publishServiceOnChain } from "@/lib/program";
import {
  getProfileByEmail, getProfileByWallet, getProfileById,
  getDirectMessages, sendDirectMessage, DirectMessage, Profile,
  uploadFileToStorage, supabase, createReport,
  markMessagesDelivered, markMessagesRead,
  upsertTypingStatus, subscribeToDirectMessages, subscribeToTypingStatus,
} from "@/lib/supabase";
import {
  ArrowLeft, Send, User, Loader2, Paperclip, FileText, Image as ImageIcon,
  ShieldCheck, Upload, X, DollarSign, Check, XCircle, Tag, CheckCheck, Flag,
} from "lucide-react";
import toast from "react-hot-toast";

export default function ChatPage() {
  const params = useParams();
  const recipientId = params.userId as string;
  const router = useRouter();
  const { publicKey, connected } = useWallet();
  const anchorWallet = useAnchorWallet();
  const { user, loading: sessionLoading } = useSession();

  const [myProfile, setMyProfile] = useState<Profile | null>(null);
  const [recipient, setRecipient] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [msgInput, setMsgInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  // File upload
  const [uploading, setUploading] = useState(false);
  const [uploadStep, setUploadStep] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);

  // Offer
  const [showOffer, setShowOffer] = useState(false);
  const [offerAmount, setOfferAmount] = useState("");
  const [offerDesc, setOfferDesc] = useState("");
  const [offerExpiry, setOfferExpiry] = useState("24"); // hours

  // Typing
  const [partnerTyping, setPartnerTyping] = useState(false);
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);

  // Reporting
  const [reportingMsg, setReportingMsg] = useState<DirectMessage | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [reporting, setReporting] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = useCallback(async () => {
    let p: Profile | null = null;
    if (user?.email) p = await getProfileByEmail(user.email);
    if (!p && publicKey) p = await getProfileByWallet(publicKey.toBase58());
    if (!p) { router.push("/register"); return; }
    setMyProfile(p);
    const r = await getProfileById(recipientId);
    setRecipient(r);
    if (r) {
      const msgs = await getDirectMessages(p.id, r.id);
      setMessages(msgs);
    }
    setLoading(false);
  }, [user?.email, publicKey, recipientId, router]);

  useEffect(() => {
    if (!sessionLoading || publicKey) fetchData();
  }, [sessionLoading, publicKey, fetchData]);

  // Realtime subscription for messages
  useEffect(() => {
    if (!myProfile || !recipient) return;
    const channel = subscribeToDirectMessages(
      myProfile.id,
      recipient.id,
      async (newMsg) => {
        // Fetch full message with sender/receiver profiles
        const msgs = await getDirectMessages(myProfile.id, recipient.id);
        setMessages(msgs);
        // Mark as delivered + read since we're in the chat
        if (newMsg.sender_id === recipient.id) {
          markMessagesDelivered([newMsg.id]);
          markMessagesRead(myProfile.id, recipient.id);
        }
      },
      (updatedMsg) => {
        setMessages((prev) =>
          prev.map((m) => (m.id === updatedMsg.id ? { ...m, delivered_at: updatedMsg.delivered_at, read_at: updatedMsg.read_at } : m))
        );
      }
    );
    return () => { supabase.removeChannel(channel); };
  }, [myProfile, recipient]);

  // Typing status subscription
  useEffect(() => {
    if (!myProfile || !recipient) return;
    const channel = subscribeToTypingStatus(myProfile.id, recipient.id, setPartnerTyping);
    return () => { supabase.removeChannel(channel); };
  }, [myProfile, recipient]);

  // Mark incoming messages as delivered+read when chat opens
  useEffect(() => {
    if (!myProfile || !recipient || messages.length === 0) return;
    const undelivered = messages.filter((m) => m.sender_id === recipient.id && !m.delivered_at).map((m) => m.id);
    if (undelivered.length > 0) markMessagesDelivered(undelivered);
    markMessagesRead(myProfile.id, recipient.id);
  }, [myProfile, recipient, messages]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, partnerTyping]);

  // Send email notification (fire-and-forget)
  const notifyByEmail = (recipientProfile: Profile, senderName: string, preview: string) => {
    if (!recipientProfile.email) return;
    fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "new_message",
        to: recipientProfile.email,
        data: {
          senderName,
          senderId: myProfile?.id,
          receiverId: recipientProfile.id,
          chatUrl: `https://wiraproject.vercel.app/chat/${myProfile?.id}`,
        },
      }),
    }).catch(() => {});
  };

  // Typing handler
  const handleTyping = () => {
    if (!myProfile || !recipient) return;
    upsertTypingStatus(myProfile.id, recipient.id, true);
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      upsertTypingStatus(myProfile.id, recipient.id, false);
    }, 2500);
  };

  const handleSend = async () => {
    if (!myProfile || !recipient) return;
    if (!msgInput.trim()) return;
    setSending(true);
    // Stop typing indicator
    upsertTypingStatus(myProfile.id, recipient.id, false);
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    const content = msgInput.trim();
    const msg = await sendDirectMessage(myProfile.id, recipient.id, content);
    if (msg) {
      setMessages((prev) => [...prev, { ...msg, sender: myProfile, receiver: recipient }]);
      setMsgInput("");
      notifyByEmail(recipient, myProfile.nombre || "Usuario", content);
    } else {
      toast.error("Error al enviar mensaje");
    }
    setSending(false);
  };

  // Send offer
  const handleSendOffer = async () => {
    if (!myProfile || !recipient || !offerAmount) return;
    const amount = parseFloat(offerAmount);
    if (isNaN(amount) || amount <= 0) { toast.error("Monto inválido"); return; }
    const expiresAt = new Date(Date.now() + parseInt(offerExpiry) * 3600 * 1000).toISOString();
    setSending(true);
    const content = `💰 OFERTA: $${amount.toFixed(2)} USDC\n📋 ${offerDesc.trim() || "Servicio personalizado"}\n\n[OFFER:${amount}:${offerDesc.trim() || "Servicio personalizado"}:${expiresAt}]`;
    const msg = await sendDirectMessage(myProfile.id, recipient.id, content);
    if (msg) {
      setMessages((prev) => [...prev, { ...msg, sender: myProfile, receiver: recipient }]);
      setShowOffer(false); setOfferAmount(""); setOfferDesc("");
      notifyByEmail(recipient, myProfile.nombre || "Usuario", `Te envió una oferta de $${amount.toFixed(2)} USDC`);
      toast.success("Oferta enviada");
    } else {
      toast.error("Error al enviar oferta");
    }
    setSending(false);
  };

  // Cancel offer (sends a cancellation marker)
  const handleCancelOffer = async (m: DirectMessage) => {
    if (!myProfile) return;
    setSending(true);
    const cancelMsg = await sendDirectMessage(myProfile.id, m.sender_id === myProfile.id ? (recipient?.id || "") : m.sender_id, `[OFFER_CANCELLED:${m.id}]`);
    if (cancelMsg) {
      setMessages((prev) => [...prev, { ...cancelMsg, sender: myProfile, receiver: recipient! }]);
      // Also update the original offer message locally to mark it cancelled
      setMessages((prev) => prev.map(msg => msg.id === m.id ? { ...msg, content: msg.content + "[CANCELLED]" } : msg));
      toast.success("Oferta cancelada");
    } else {
      toast.error("Error al cancelar");
    }
    setSending(false);
  };

  // Accept offer - creates order + on-chain escrow payment
  const handleAcceptOffer = async (m: DirectMessage) => {
    if (!myProfile || !recipient) return;
    const match = m.content.match(/\[OFFER:([\d.]+):(.+?)\]/);
    if (!match) return;
    const amount = parseFloat(match[1]);
    const desc = match[2];
    const freelancerId = m.sender_id;

    // Require wallet connection
    if (!connected || !anchorWallet || !publicKey) {
      toast.error("Conecta tu wallet Phantom para aceptar y pagar");
      return;
    }

    setSending(true);
    try {
      // Get freelancer wallet for on-chain tx
      const freelancerProfile = await getProfileById(freelancerId);
      const freelancerWallet = freelancerProfile?.wallet_address;
      if (!freelancerWallet) {
        toast.error("El freelancer no tiene wallet configurada");
        setSending(false);
        return;
      }

      const freelancerPubkey = new PublicKey(freelancerWallet);
      const connection = getConnection();
      const provider = new AnchorProvider(connection, anchorWallet, { commitment: "confirmed" });

      // Ensure freelancer has on-chain service, auto-publish if needed
      let servicePDA: PublicKey;
      try {
        const result = await findOnChainService(provider, freelancerPubkey);
        servicePDA = result.servicePDA;
      } catch {
        // Auto-publish a service on-chain for the freelancer
        toast("Preparando servicio on-chain...", { icon: "⏳" });
        await publishServiceOnChain(
          provider,
          {
            nombre: freelancerProfile?.nombre || "Freelancer",
            bio: freelancerProfile?.bio || "",
            categoria: "Personalizado",
            skills: freelancerProfile?.skills || [],
          },
          {
            titulo: `Oferta: ${desc}`,
            descripcion: desc,
            precioUsdc: amount,
            deliveryDays: 7,
            categoria: "Personalizado",
          },
        );
        const result = await findOnChainService(provider, freelancerPubkey);
        servicePDA = result.servicePDA;
      }

      // Execute on-chain payment — USDC goes to escrow
      toast("Firma la transacción en Phantom...", { icon: "✍️" });
      const txSignature = await placeOrderOnChain(provider, servicePDA);

      // Create service + order in DB with tx_signature
      const { data: svc } = await supabase.from("services").insert({
        owner_id: freelancerId,
        titulo: `Oferta: ${desc}`,
        descripcion: `Oferta personalizada aceptada via chat.\n${desc}`,
        precio_usdc: amount,
        categoria: "Personalizado",
        delivery_days: 7,
        activo: false,
      }).select().single();

      if (!svc) throw new Error("Error creating service");

      const { data: ord } = await supabase.from("orders").insert({
        service_id: svc.id,
        client_id: myProfile.id,
        freelancer_id: freelancerId,
        amount_usdc: amount,
        status: "in_progress",
        tx_signature: txSignature,
      }).select().single();

      if (!ord) throw new Error("Error creating order");

      const acceptMsg = await sendDirectMessage(myProfile.id, m.sender_id, `✅ Oferta aceptada y pagada: $${amount.toFixed(2)} USDC — "${desc}"\n\n💰 USDC depositado en escrow.\n📋 Orden: /orders/${ord.id}`);
      if (acceptMsg) {
        setMessages((prev) => [...prev, { ...acceptMsg, sender: myProfile, receiver: recipient }]);
      }

      notifyByEmail(recipient, myProfile.nombre || "Usuario", `Aceptó y pagó tu oferta de $${amount.toFixed(2)} USDC`);
      toast.success("¡Pago realizado! USDC en escrow.");
      router.push(`/orders/${ord.id}`);
    } catch (err: any) {
      console.error(err);
      const msg = err?.message || "";
      if (msg.includes("User rejected")) {
        toast.error("Transacción cancelada");
      } else if (msg.includes("insufficient") || msg.includes("0x1")) {
        toast.error("No tienes suficiente USDC");
      } else {
        toast.error(msg.slice(0, 120) || "Error al procesar el pago");
      }
    }
    setSending(false);
  };

  const handleFileUpload = async (file: File) => {
    if (!myProfile || !recipient) return;
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) { toast.error("Archivo máximo 10MB"); return; }

    setUploading(true); setUploadProgress(0);

    try {
      setUploadStep("scan"); setUploadProgress(15);
      const formData = new FormData();
      formData.append("file", file);
      const scanRes = await fetch("/api/upload", { method: "POST", body: formData });
      const scanData = await scanRes.json();
      if (scanData.status === "malicious") {
        toast.error("⚠️ Archivo bloqueado: detectado como malicioso");
        setUploading(false); setUploadStep(""); setUploadProgress(0);
        return;
      }
      setUploadProgress(40);

      setUploadStep("upload"); setUploadProgress(60);
      const url = await uploadFileToStorage(file);
      if (!url) { toast.error("Error al subir archivo"); setUploading(false); return; }
      setUploadProgress(85);

      setUploadStep("send"); setUploadProgress(95);
      const content = `📎 ${file.name}`;
      const msg = await sendDirectMessage(myProfile.id, recipient.id, content, url, file.name);
      if (msg) {
        setMessages((prev) => [...prev, { ...msg, sender: myProfile, receiver: recipient }]);
        notifyByEmail(recipient, myProfile.nombre || "Usuario", `Envió un archivo: ${file.name}`);
        toast.success("Archivo enviado");
      }
      setUploadProgress(100);
    } catch (err) {
      console.error(err);
      toast.error("Error al procesar archivo");
    } finally {
      setTimeout(() => { setUploading(false); setUploadStep(""); setUploadProgress(0); }, 500);
    }
  };

  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); setDragOver(false); const file = e.dataTransfer.files[0]; if (file) handleFileUpload(file); };
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (file) handleFileUpload(file); if (fileInputRef.current) fileInputRef.current.value = ""; };
  const isOnline = (lastSeen: string | null) => { if (!lastSeen) return false; return Date.now() - new Date(lastSeen).getTime() < 24 * 60 * 60 * 1000; };
  const isImage = (url: string) => /\.(jpg|jpeg|png|gif|webp)($|\?)/i.test(url);
  const isOffer = (content: string) => content.includes("[OFFER:");
  const isAccepted = (content: string) => content.startsWith("✅ Oferta aceptada");

  // Read receipt check marks component
  const MessageChecks = ({ m }: { m: DirectMessage }) => {
    if (m.sender_id !== myProfile?.id) return null; // only show on my messages
    if (m.read_at) {
      return <span className="inline-flex" title="Visto"><CheckCheck className="w-3.5 h-3.5 text-[#53BDEB]" /></span>;
    }
    if (m.delivered_at) {
      return <span className="inline-flex" title="Entregado"><CheckCheck className="w-3.5 h-3.5 text-white/60" /></span>;
    }
    return <span className="inline-flex" title="Enviado"><Check className="w-3.5 h-3.5 text-white/60" /></span>;
  };

  if (loading) return (<><Navigation /><div className="flex min-h-[60vh] items-center justify-center"><div className="h-12 w-12 animate-spin rounded-full border-4 border-black border-t-transparent" /></div></>);
  if (!recipient) return (<><Navigation /><div className="flex min-h-[60vh] items-center justify-center"><p className="font-bold">Usuario no encontrado</p></div></>);

  const online = isOnline(recipient.last_seen || null);
  // Determine if I'm a freelancer (have services) to show offer button
  const isFreelancer = myProfile?.categoria && myProfile.categoria !== "";

  return (
    <>
      <Navigation />
      <div className="container mx-auto px-4 py-4 max-w-2xl flex flex-col" style={{ height: "calc(100vh - 120px)" }}>
        {/* Header */}
        <div className="bg-white border-4 border-black rounded-xl p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-4 flex items-center gap-3">
          <button onClick={() => router.back()} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#F5F5F5]">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <Link href={`/u/${recipient.username || recipient.id}`} className="relative hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 rounded-full border-2 border-black bg-[#9945FF] flex items-center justify-center text-white font-bold overflow-hidden">
              {recipient.avatar_url ? <img src={recipient.avatar_url} alt="" className="w-full h-full object-cover" /> : recipient.nombre?.charAt(0).toUpperCase() || "?"}
            </div>
            <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${online ? "bg-green-500" : "bg-gray-300"}`} />
          </Link>
          <div className="flex-1 min-w-0">
            <Link href={`/u/${recipient.username || recipient.id}`} className="font-bold text-sm truncate hover:text-[#9945FF] hover:underline transition-colors block">{recipient.nombre}</Link>
            <p className="text-[10px] text-[#393939] font-medium">
              {online ? "🟢 Online" : "⚪ Offline"} · {recipient.categoria || "Freelancer"}
            </p>
          </div>
          <Link href={`/u/${recipient.username || recipient.id}`} className="text-xs font-bold text-[#9945FF] hover:underline">
            Ver perfil
          </Link>
        </div>

        {/* Upload progress */}
        {uploading && (
          <div className="bg-white border-3 border-black rounded-xl p-3 mb-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center gap-3 flex-1">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold ${uploadStep === "scan" ? "bg-[#9945FF] animate-pulse" : uploadProgress > 40 ? "bg-green-500" : "bg-gray-300"}`}>
                  <ShieldCheck className="w-3 h-3" />
                </div>
                <div className={`h-0.5 flex-1 rounded ${uploadProgress > 40 ? "bg-green-500" : "bg-gray-200"}`} />
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold ${uploadStep === "upload" ? "bg-[#9945FF] animate-pulse" : uploadProgress > 85 ? "bg-green-500" : "bg-gray-300"}`}>
                  <Upload className="w-3 h-3" />
                </div>
                <div className={`h-0.5 flex-1 rounded ${uploadProgress > 85 ? "bg-green-500" : "bg-gray-200"}`} />
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold ${uploadStep === "send" ? "bg-[#9945FF] animate-pulse" : uploadProgress >= 100 ? "bg-green-500" : "bg-gray-300"}`}>
                  <Send className="w-3 h-3" />
                </div>
              </div>
            </div>
            <p className="text-[10px] font-bold text-center text-[#393939]">
              {uploadStep === "scan" ? "🔍 Escaneando con VirusTotal..." : uploadStep === "upload" ? "📤 Subiendo archivo..." : uploadStep === "send" ? "💬 Enviando..." : "Procesando..."}
            </p>
            <div className="mt-1.5 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#9945FF] to-[#14F195] rounded-full transition-all duration-500" style={{ width: `${uploadProgress}%` }} />
            </div>
          </div>
        )}

        {/* Offer panel */}
        {showOffer && (
          <div className="bg-white border-3 border-black rounded-xl p-4 mb-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2"><Tag className="w-4 h-4 text-[#9945FF]" /> Enviar Oferta</h3>
              <button onClick={() => setShowOffer(false)} className="w-6 h-6 flex items-center justify-center rounded hover:bg-[#F5F5F5]"><X className="w-4 h-4" /></button>
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#393939]" />
                <input type="number" value={offerAmount} onChange={(e) => setOfferAmount(e.target.value)}
                  placeholder="Monto USDC" step="0.01" min="1"
                  className="w-full pl-9 pr-4 py-2.5 border-2 border-black rounded-lg text-sm font-bold focus:outline-none focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" />
              </div>
              <select value={offerExpiry} onChange={(e) => setOfferExpiry(e.target.value)}
                className="border-2 border-black rounded-lg px-3 py-2.5 text-sm font-bold bg-white focus:outline-none">
                <option value="12">12h</option>
                <option value="24">24h</option>
                <option value="48">48h</option>
                <option value="72">72h</option>
              </select>
            </div>
            <input type="text" value={offerDesc} onChange={(e) => setOfferDesc(e.target.value)}
              placeholder="Descripción del servicio..."
              className="w-full px-4 py-2.5 border-2 border-black rounded-lg text-sm font-medium focus:outline-none focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" />
            <button onClick={handleSendOffer} disabled={!offerAmount || sending}
              className="w-full bg-[#9945FF] text-white border-3 border-black rounded-xl py-3 font-bold text-sm shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-40">
              {sending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : `Enviar Oferta — $${offerAmount || "0"} USDC · Vence en ${offerExpiry}h`}
            </button>
          </div>
        )}

        {/* Messages */}
        <div
          className={`flex-1 overflow-y-auto bg-[#FAFAFA] border-4 rounded-xl p-4 space-y-3 mb-4 transition-colors ${dragOver ? "border-[#9945FF] bg-purple-50" : "border-black"}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          {dragOver && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center animate-pulse">
                <Upload className="w-10 h-10 mx-auto mb-2 text-[#9945FF]" />
                <p className="font-bold text-[#9945FF]">Suelta el archivo aquí</p>
              </div>
            </div>
          )}

          {!dragOver && messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <User className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                <p className="text-sm font-bold text-[#393939]">Inicia una conversación</p>
                <p className="text-xs text-[#393939]">Escribe tu primer mensaje a {recipient.nombre}</p>
              </div>
            </div>
          ) : !dragOver && (
            messages.map((m) => {
              const isMine = m.sender_id === myProfile?.id;
              const offer = isOffer(m.content);
              const accepted = isAccepted(m.content);

              // Render offer card
              if (offer) {
                const match = m.content.match(/\[OFFER:([\d.]+):(.+?)(?::([\d\-T:.Z]+))?\]/);
                const amt = match ? match[1] : "0";
                const desc = match ? match[2] : "";
                const expiresAt = match?.[3] ? new Date(match[3]) : null;
                const isCancelled = m.content.includes("[CANCELLED]") ||
                  messages.some(msg => msg.content.includes(`[OFFER_CANCELLED:${m.id}]`));
                const isExpired = expiresAt && expiresAt < new Date();
                const canCancel = !isCancelled && !isExpired;

                // Compute time left
                let timeLeft = "";
                if (expiresAt && !isCancelled) {
                  const diff = expiresAt.getTime() - Date.now();
                  if (diff > 0) {
                    const h = Math.floor(diff / 3600000);
                    const min = Math.floor((diff % 3600000) / 60000);
                    timeLeft = h > 0 ? `${h}h ${min}m` : `${min}m`;
                  }
                }

                return (
                  <div key={m.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] rounded-xl overflow-hidden border-3 ${
                      isCancelled || isExpired ? "border-gray-300 opacity-60" : isMine ? "border-[#9945FF]" : "border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
                    }`}>
                      <div className={`p-3 text-white text-center ${
                        isCancelled ? "bg-gray-400" : isExpired ? "bg-gray-500" : "bg-gradient-to-r from-[#9945FF] to-[#14F195]"
                      }`}>
                        <p className="text-[10px] font-bold opacity-80">{isCancelled ? "CANCELADA" : isExpired ? "VENCIDA" : "OFERTA"}</p>
                        <p className="text-2xl font-black">${amt} <span className="text-sm">USDC</span></p>
                        {timeLeft && !isCancelled && (
                          <p className="text-[10px] opacity-80">⏱ Vence en {timeLeft}</p>
                        )}
                      </div>
                      <div className="bg-white p-3">
                        <p className="text-sm font-medium text-[#393939]">{desc}</p>
                        <p className="text-[9px] text-[#393939] mt-1">
                          {new Date(m.created_at).toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                        {!isCancelled && !isExpired && !isMine && connected && (
                          <button onClick={() => handleAcceptOffer(m)} disabled={sending}
                            className="w-full mt-2 bg-green-500 text-white border-2 border-black rounded-lg py-2 font-bold text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-40 flex items-center justify-center gap-1">
                            <Check className="w-4 h-4" /> Aceptar y Pagar
                          </button>
                        )}
                        {!isCancelled && !isExpired && !isMine && !connected && (
                          <p className="text-[10px] text-orange-600 font-bold mt-2 text-center">⚠️ Conecta tu wallet para aceptar y pagar</p>
                        )}
                        {canCancel && (
                          <button onClick={() => handleCancelOffer(m)} disabled={sending}
                            className="w-full mt-2 bg-white text-red-500 border-2 border-red-400 rounded-lg py-1.5 font-bold text-xs hover:bg-red-50 transition-colors flex items-center justify-center gap-1">
                            <XCircle className="w-3.5 h-3.5" /> Cancelar oferta
                          </button>
                        )}
                        {isMine && !isCancelled && !isExpired && <p className="text-[10px] text-[#9945FF] font-bold mt-1 text-center">Oferta enviada ✓</p>}
                      </div>
                    </div>
                  </div>
                );
              }

              // Render accepted offer
              if (accepted) {
                return (
                  <div key={m.id} className="flex justify-center">
                    <div className="bg-green-50 border-2 border-green-500 rounded-xl px-5 py-3 text-center">
                      <Check className="w-5 h-5 text-green-600 mx-auto mb-1" />
                      <p className="text-sm font-bold text-green-700">{m.content.split("\n")[0]}</p>
                      <p className="text-[10px] text-green-600 mt-1">{m.content.split("\n")[1]}</p>
                    </div>
                  </div>
                );
              }

              return (
                <div key={m.id} className={`flex group ${isMine ? "justify-end" : "justify-start"}`}>
                  {/* Report button for received messages */}
                  {!isMine && (
                    <button
                      onClick={() => { setReportingMsg(m); setReportReason(""); }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity self-center mr-1 p-1 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"
                      title="Reportar mensaje">
                      <Flag className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <div className={`max-w-[75%] rounded-xl px-4 py-2.5 ${
                    isMine
                      ? "bg-[#9945FF] text-white border-2 border-[#7B2FD4] rounded-br-sm"
                      : "bg-white text-black border-2 border-black rounded-bl-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  }`}>
                    {m.file_url && (
                      <div className="mb-2">
                        {isImage(m.file_url) ? (
                          <a href={m.file_url} target="_blank" rel="noopener noreferrer">
                            <img src={m.file_url} alt={m.file_name || "imagen"} className="rounded-lg max-h-48 w-auto border border-black/10" />
                          </a>
                        ) : (
                          <a href={m.file_url} target="_blank" rel="noopener noreferrer"
                            className={`flex items-center gap-2 p-2 rounded-lg border ${isMine ? "border-white/20 hover:bg-white/10" : "border-black/10 hover:bg-[#F5F5F5]"} transition-colors`}>
                            <FileText className="w-5 h-5 flex-shrink-0" />
                            <span className="text-xs font-bold truncate">{m.file_name || "archivo"}</span>
                          </a>
                        )}
                      </div>
                    )}
                    {(!m.file_url || !m.content.startsWith("📎")) && (
                      <p className="text-sm font-medium whitespace-pre-wrap break-words">{m.content}</p>
                    )}
                    <p className={`text-[9px] mt-1 flex items-center gap-1 ${isMine ? "text-white/60 justify-end" : "text-[#393939]"}`}>
                      {new Date(m.created_at).toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit" })}
                      {isMine && <MessageChecks m={m} />}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          {/* Typing indicator */}
          {partnerTyping && (
            <div className="flex justify-start">
              <div className="bg-white border-2 border-black rounded-xl px-4 py-2.5 rounded-bl-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-[#9945FF] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-[#9945FF] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-[#9945FF] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div className="bg-white border-4 border-black rounded-xl p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex items-center gap-2">
            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}
              className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-[#F5F5F5] transition-colors disabled:opacity-30"
              title="Adjuntar archivo">
              <Paperclip className="w-5 h-5 text-[#393939]" />
            </button>
            {isFreelancer && (
              <button type="button" onClick={() => setShowOffer(!showOffer)}
                className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors ${showOffer ? "bg-[#9945FF] text-white" : "hover:bg-[#F5F5F5] text-[#393939]"}`}
                title="Enviar oferta USDC">
                <DollarSign className="w-5 h-5" />
              </button>
            )}
            <input ref={fileInputRef} type="file" accept="image/*,.pdf,.doc,.docx,.zip" onChange={handleFileInput} className="hidden" />
            <input
              type="text"
              value={msgInput}
              onChange={(e) => { setMsgInput(e.target.value); handleTyping(); }}
              placeholder="Escribe un mensaje..."
              className="flex-1 px-3 py-3 text-sm font-medium focus:outline-none"
              disabled={sending || uploading}
            />
            <button type="submit" disabled={!msgInput.trim() || sending || uploading}
              className="w-11 h-11 bg-[#9945FF] text-white rounded-lg border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-30">
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </form>
        </div>
      </div>

      {/* Report Message Modal */}
      {reportingMsg && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white border-4 border-black rounded-xl p-6 max-w-sm w-full shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg flex items-center gap-2"><Flag className="w-5 h-5 text-red-500" /> Reportar mensaje</h3>
              <button onClick={() => setReportingMsg(null)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#F5F5F5]"><X className="w-5 h-5" /></button>
            </div>
            <div className="bg-[#F5F5F5] border-2 border-black/10 rounded-lg p-3">
              <p className="text-sm text-[#393939] line-clamp-3">{reportingMsg.content}</p>
            </div>
            <select value={reportReason} onChange={(e) => setReportReason(e.target.value)}
              className="w-full border-3 border-black rounded-lg px-4 py-3 text-sm font-medium focus:outline-none">
              <option value="">Selecciona un motivo</option>
              <option value="acoso">Acoso o amenazas</option>
              <option value="spam">Spam o publicidad</option>
              <option value="fraude">Fraude o estafa</option>
              <option value="contenido_inapropiado">Contenido inapropiado</option>
              <option value="otro">Otro</option>
            </select>
            <div className="flex gap-3">
              <button onClick={() => setReportingMsg(null)}
                className="flex-1 bg-white border-3 border-black rounded-xl py-3 font-bold text-sm hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all">
                Cancelar
              </button>
              <button
                disabled={!reportReason || reporting}
                onClick={async () => {
                  if (!myProfile || !reportReason) return;
                  setReporting(true);
                  const r = await createReport({
                    reporter_id: myProfile.id,
                    reported_user_id: reportingMsg.sender_id,
                    reported_message_id: reportingMsg.id,
                    reason: reportReason,
                    details: `Mensaje: "${reportingMsg.content.slice(0, 200)}"`,
                  });
                  setReporting(false);
                  if (r) {
                    toast.success("Reporte enviado. Será revisado en 48h.");
                    setReportingMsg(null);
                    setReportReason("");
                  } else {
                    toast.error("Error al enviar reporte");
                  }
                }}
                className="flex-1 bg-red-500 text-white border-3 border-black rounded-xl py-3 font-bold text-sm shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] disabled:opacity-40">
                {reporting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Enviar Reporte"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
