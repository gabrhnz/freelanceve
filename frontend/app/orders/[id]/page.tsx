"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Navigation } from "@/components/navigation";
import { useSession } from "@/contexts/session-context";
import { useWallet, useAnchorWallet } from "@solana/wallet-adapter-react";
import { AnchorProvider } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import {
  getConnection, placeOrderOnChain, findOnChainService,
  deliverOrderOnChain, approveOrderOnChain,
  findOnChainOrder, getExplorerUrl,
} from "@/lib/program";
import {
  getOrderById,
  getProfileByEmail,
  getProfileByWallet,
  getProfileById,
  acceptOrder as acceptOrderDb,
  updateOrderStatus,
  getMessagesByOrder,
  sendMessage,
  getReviewByOrder,
  createReview,
  uploadFileToStorage,
  supabase,
  subscribeToOrderMessages,
  markOrderMessagesDelivered,
  markOrderMessagesRead,
  getDirectMessages,
  upsertTypingStatus,
  subscribeToTypingStatus,
  Order,
  Profile,
  Message,
  Review,
  DirectMessage,
} from "@/lib/supabase";
import {
  ArrowLeft, Clock, CheckCircle, ShieldCheck, Star,
  Send, AlertTriangle, Loader2, Package, User, MessageSquare,
  Paperclip, FileText, Image as ImageIcon, X, ShieldAlert, Download,
  Check, CheckCheck, Wallet,
} from "lucide-react";
import toast from "react-hot-toast";

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params.id as string;
  const router = useRouter();
  const { user } = useSession();
  const { publicKey, connected } = useWallet();
  const anchorWallet = useAnchorWallet();

  const [order, setOrder] = useState<Order | null>(null);
  const [myProfile, setMyProfile] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [review, setReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [msgInput, setMsgInput] = useState("");
  const [sending, setSending] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [reviewStep, setReviewStep] = useState(1);
  const [rating, setRating] = useState(5);
  const [onTime, setOnTime] = useState<boolean | null>(null);
  const [asExpected, setAsExpected] = useState<boolean | null>(null);
  const [recommend, setRecommend] = useState<boolean | null>(null);
  const [comment, setComment] = useState("");
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStep, setUploadStep] = useState("");
  const [uploadFileName, setUploadFileName] = useState("");
  const [dmHistory, setDmHistory] = useState<DirectMessage[]>([]);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchOrder = useCallback(async () => {
    const data = await getOrderById(orderId);
    setOrder(data);
    setLoading(false);
  }, [orderId]);

  const fetchProfile = useCallback(async () => {
    let p: Profile | null = null;
    if (user?.email) p = await getProfileByEmail(user.email);
    if (!p && publicKey) p = await getProfileByWallet(publicKey.toBase58());
    setMyProfile(p);
  }, [user?.email, publicKey]);

  const fetchMessages = useCallback(async () => {
    const msgs = await getMessagesByOrder(orderId);
    setMessages(msgs);
  }, [orderId]);

  const fetchReview = useCallback(async () => {
    const r = await getReviewByOrder(orderId);
    setReview(r);
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
    fetchProfile();
    fetchMessages();
    fetchReview();
  }, [fetchOrder, fetchProfile, fetchMessages, fetchReview]);

  // Load DM history between client and freelancer
  useEffect(() => {
    if (!order) return;
    const loadDMs = async () => {
      const dms = await getDirectMessages(order.client_id, order.freelancer_id);
      // Only DMs before the order was created
      const orderDate = new Date(order.created_at).getTime();
      setDmHistory(dms.filter(d => new Date(d.created_at).getTime() < orderDate));
    };
    loadDMs();
  }, [order?.id, order?.client_id, order?.freelancer_id]);

  // Realtime subscription for order messages
  useEffect(() => {
    if (!myProfile || !order) return;
    const channel = subscribeToOrderMessages(
      orderId,
      async () => {
        const msgs = await getMessagesByOrder(orderId);
        setMessages(msgs);
        markOrderMessagesRead(orderId, myProfile.id);
      },
      (updatedMsg) => {
        setMessages(prev => prev.map(m => m.id === updatedMsg.id ? { ...m, delivered_at: updatedMsg.delivered_at, read_at: updatedMsg.read_at } : m));
      }
    );
    return () => { supabase.removeChannel(channel); };
  }, [myProfile?.id, orderId, order?.id]);

  // Typing subscription
  useEffect(() => {
    if (!myProfile || !order) return;
    const partnerId = isFreelancer ? order.client_id : order.freelancer_id;
    if (!partnerId) return;
    const channel = subscribeToTypingStatus(myProfile.id, partnerId, setPartnerTyping);
    return () => { supabase.removeChannel(channel); };
  }, [myProfile?.id, order?.id]);

  // Mark messages as read on load
  useEffect(() => {
    if (!myProfile || messages.length === 0) return;
    const undelivered = messages.filter(m => m.sender_id !== myProfile.id && !m.delivered_at).map(m => m.id);
    if (undelivered.length > 0) markOrderMessagesDelivered(undelivered);
    markOrderMessagesRead(orderId, myProfile.id);
  }, [myProfile?.id, messages]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, partnerTyping]);

  const isFreelancer = myProfile?.id === order?.freelancer_id;
  const isClient = myProfile?.id === order?.client_id;
  const isParty = isFreelancer || isClient;

  // Time left for acceptance (24h from creation)
  const getAcceptanceDeadline = () => {
    if (!order) return null;
    const created = new Date(order.created_at).getTime();
    const deadline = created + 24 * 60 * 60 * 1000;
    const now = Date.now();
    const diff = deadline - now;
    if (diff <= 0) return "Vencido";
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    return `${h}h ${m}m`;
  };

  const handleAccept = async () => {
    if (!order) return;
    setActionLoading(true);
    try {
      await acceptOrderDb(order.id);
      toast.success("¡Orden aceptada!");
      fetchOrder();
    } catch (err) {
      console.error(err);
      toast.error("Error al aceptar la orden");
    } finally {
      setActionLoading(false);
    }
  };

  // Client pays USDC into escrow
  const handlePayEscrow = async () => {
    if (!order || !myProfile || !anchorWallet || !publicKey) return;
    setActionLoading(true);
    try {
      // Get freelancer wallet
      let freelancerWallet = order.freelancer?.wallet_address;
      if (!freelancerWallet) {
        const fp = await getProfileById(order.freelancer_id);
        freelancerWallet = fp?.wallet_address || null;
      }
      if (!freelancerWallet) {
        toast.error("El freelancer no tiene wallet configurada");
        setActionLoading(false);
        return;
      }

      const freelancerPubkey = new PublicKey(freelancerWallet);
      const connection = getConnection();
      const provider = new AnchorProvider(connection, anchorWallet, { commitment: "confirmed" });

      const { servicePDA } = await findOnChainService(provider, freelancerPubkey);
      const txSignature = await placeOrderOnChain(provider, servicePDA);

      // Update order in DB with tx_signature and advance status
      await updateOrderStatus(order.id, "in_progress", txSignature);
      toast.success("¡Pago realizado! USDC en escrow.");
      window.open(getExplorerUrl(txSignature), "_blank");
      fetchOrder();
    } catch (err: any) {
      console.error(err);
      const msg = err?.message || "";
      if (msg.includes("insufficient") || msg.includes("0x1")) {
        toast.error("No tienes suficiente USDC para esta orden");
      } else if (msg.includes("User rejected")) {
        toast.error("Transacción cancelada");
      } else if (msg === "PROFILE_NOT_INITIALIZED" || msg === "SERVICE_NOT_INITIALIZED") {
        toast.error("El servicio no está disponible on-chain aún");
      } else {
        toast.error(msg.slice(0, 120) || "Error al procesar el pago");
      }
    } finally {
      setActionLoading(false);
    }
  };

  // Typing handler for order chat
  const handleOrderTyping = () => {
    if (!myProfile || !order) return;
    const partnerId = isFreelancer ? order.client_id : order.freelancer_id;
    upsertTypingStatus(myProfile.id, partnerId, true);
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      upsertTypingStatus(myProfile.id, partnerId, false);
    }, 2500);
  };

  const handleDeliver = async () => {
    if (!order || !anchorWallet || !publicKey) {
      toast.error("Conecta tu wallet para entregar on-chain");
      return;
    }
    setActionLoading(true);
    try {
      const connection = getConnection();
      const provider = new AnchorProvider(connection, anchorWallet, { commitment: "confirmed" });

      // Find the on-chain order PDA
      const freelancerPubkey = publicKey;
      const clientPubkey = new PublicKey(order.client?.wallet_address || "");
      const orderPDA = await findOnChainOrder(provider, freelancerPubkey, clientPubkey);

      if (orderPDA) {
        const txSig = await deliverOrderOnChain(provider, orderPDA);
        await updateOrderStatus(order.id, "delivered", txSig);
        toast.success("¡Entregado on-chain!");
        window.open(getExplorerUrl(txSig), "_blank");
      } else {
        // Fallback: update DB only
        await updateOrderStatus(order.id, "delivered");
        toast.success("¡Orden marcada como entregada!");
      }
      fetchOrder();
    } catch (err: any) {
      console.error(err);
      if (err?.message?.includes("User rejected")) {
        toast.error("Transacción cancelada");
      } else {
        // Fallback: update DB
        await updateOrderStatus(order.id, "delivered");
        toast.success("Entregado (off-chain)");
        fetchOrder();
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveAndRate = async () => {
    if (!order || !myProfile) return;
    setShowRating(true);
  };

  const submitApproval = async () => {
    if (!order || !myProfile) return;
    setActionLoading(true);
    try {
      // Build structured review comment
      const reviewMeta = [
        onTime !== null ? `⏱️ ${onTime ? "Entregó a tiempo" : "No entregó a tiempo"}` : "",
        asExpected !== null ? `🎯 ${asExpected ? "Fue lo esperado" : "No fue lo esperado"}` : "",
        recommend !== null ? `${recommend ? "👍 Lo recomienda" : "👎 No lo recomienda"}` : "",
      ].filter(Boolean).join(" · ");
      const fullComment = [reviewMeta, comment.trim()].filter(Boolean).join("\n\n");

      // Try on-chain approve first (releases USDC from escrow)
      let approveTxSig: string | undefined;
      if (anchorWallet && publicKey && order.freelancer?.wallet_address) {
        try {
          const connection = getConnection();
          const provider = new AnchorProvider(connection, anchorWallet, { commitment: "confirmed" });
          const freelancerPubkey = new PublicKey(order.freelancer.wallet_address);

          const orderPDA = await findOnChainOrder(provider, freelancerPubkey, publicKey);
          if (orderPDA) {
            approveTxSig = await approveOrderOnChain(provider, orderPDA, freelancerPubkey);
            toast.success("USDC liberado on-chain!");
            window.open(getExplorerUrl(approveTxSig), "_blank");
          }
        } catch (chainErr: any) {
          console.warn("On-chain approve failed:", chainErr?.message);
          if (chainErr?.message?.includes("User rejected")) {
            toast.error("Transacción cancelada");
            setActionLoading(false);
            return;
          }
          toast("Aprobado off-chain. Los USDC se liberarán manualmente.", { icon: "ℹ️" });
        }
      }

      // Update Supabase status
      await updateOrderStatus(order.id, "completed", approveTxSig);

      await createReview({
        order_id: order.id,
        reviewer_id: myProfile.id,
        freelancer_id: order.freelancer_id,
        rating,
        comment: fullComment || undefined,
      });
      toast.success("¡Trabajo aprobado y calificado!");
      setShowRating(false);
      fetchOrder();
      fetchReview();
    } catch (err: any) {
      console.error(err);
      toast.error("Error al aprobar el trabajo");
    } finally {
      setActionLoading(false);
    }
  };

  // Send email notification (fire-and-forget)
  const notify = async (type: string, to: string, data: any) => {
    try {
      await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, to, data }),
      });
    } catch {}
  };

  const getRecipientEmail = () => {
    if (isFreelancer) return order?.client?.email;
    return order?.freelancer?.email;
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgInput.trim() || !myProfile || !order) return;
    setSending(true);
    // Stop typing
    const partnerId = isFreelancer ? order.client_id : order.freelancer_id;
    upsertTypingStatus(myProfile.id, partnerId, false);
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    const msg = await sendMessage(order.id, myProfile.id, msgInput.trim());
    if (msg) {
      setMessages((prev) => [...prev, msg]);
      setMsgInput("");
      const recipientEmail = getRecipientEmail();
      if (recipientEmail) {
        notify("new_message", recipientEmail, {
          senderName: myProfile.nombre,
          content: msgInput.trim(),
          orderUrl: `https://wiraproject.vercel.app/orders/${order.id}`,
        });
      }
    } else {
      toast.error("Error al enviar mensaje");
    }
    setSending(false);
  };

  const handleFileUpload = async (file: File) => {
    if (!myProfile || !order) return;
    if (file.size > 10 * 1024 * 1024) { toast.error("Archivo muy grande (máx 10MB)"); return; }
    const allowed = ["image/jpeg","image/png","image/gif","image/webp","application/pdf"];
    if (!allowed.includes(file.type)) { toast.error("Solo imágenes y PDF"); return; }

    setUploading(true);
    setUploadFileName(file.name);
    setUploadProgress(0);
    setUploadStep("Escaneando con VirusTotal...");

    try {
      // Step 1: Virus scan (0-50%)
      setUploadProgress(10);
      const formData = new FormData();
      formData.append("file", file);
      const scanRes = await fetch("/api/upload", { method: "POST", body: formData });
      setUploadProgress(40);
      const scanResult = await scanRes.json();

      if (!scanRes.ok || scanResult.blocked) {
        toast.error(scanResult.message || scanResult.error || "Archivo bloqueado", { icon: "🛡️" });
        setUploading(false);
        return;
      }
      setUploadProgress(50);
      setUploadStep("Subiendo archivo...");

      // Step 2: Upload to Supabase Storage (50-85%)
      setUploadProgress(60);
      const fileUrl = await uploadFileToStorage(file);
      setUploadProgress(85);

      if (!fileUrl) {
        toast.error("Error al subir archivo. Verifica el bucket 'attachments' en Supabase Storage.");
        setUploading(false);
        return;
      }

      // Step 3: Send message (85-100%)
      setUploadStep("Enviando...");
      setUploadProgress(90);
      const msg = await sendMessage(
        order.id, myProfile.id,
        file.type.startsWith("image/") ? "📷 Imagen" : `📎 ${file.name}`,
        { url: fileUrl, name: file.name, type: file.type }
      );
      setUploadProgress(100);

      if (msg) {
        setMessages((prev) => [...prev, msg]);
        const recipientEmail = getRecipientEmail();
        if (recipientEmail) {
          notify("new_message", recipientEmail, {
            senderName: myProfile.nombre,
            content: `📎 ${file.name}`,
            orderUrl: `https://wiraproject.vercel.app/orders/${order.id}`,
          });
        }
      }
      toast.success(scanResult.message || "Archivo subido ✓", { icon: "🛡️" });
    } catch (err) {
      console.error(err);
      toast.error("Error al subir archivo");
    } finally {
      setUploading(false);
      setUploadProgress(0);
      setUploadStep("");
      setUploadFileName("");
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    pending: { label: "Pendiente de aceptación", color: "bg-orange-100 text-orange-800", icon: <Clock className="w-4 h-4" /> },
    accepted: { label: "Aceptada · En progreso", color: "bg-blue-100 text-blue-700", icon: <CheckCircle className="w-4 h-4" /> },
    in_progress: { label: "En Progreso", color: "bg-blue-100 text-blue-700", icon: <Clock className="w-4 h-4" /> },
    delivered: { label: "Entregado", color: "bg-yellow-100 text-yellow-700", icon: <Package className="w-4 h-4" /> },
    completed: { label: "Completado", color: "bg-green-100 text-green-700", icon: <CheckCircle className="w-4 h-4" /> },
    refunded: { label: "Reembolsado", color: "bg-red-100 text-red-700", icon: <AlertTriangle className="w-4 h-4" /> },
    cancelled: { label: "Cancelado", color: "bg-gray-100 text-gray-500", icon: <AlertTriangle className="w-4 h-4" /> },
  };

  if (loading) {
    return (
      <>
        <Navigation />
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-black border-t-transparent" />
        </div>
      </>
    );
  }

  if (!order) {
    return (
      <>
        <Navigation />
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="bg-white border-4 border-black rounded-xl p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-center max-w-md mx-4">
            <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-xl font-bold mb-2">Orden no encontrada</p>
            <Link href="/orders" className="inline-flex items-center gap-2 mt-4 bg-black text-white border-3 border-black rounded-lg px-5 py-2.5 font-bold text-sm shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <ArrowLeft className="w-4 h-4" /> Volver a Órdenes
            </Link>
          </div>
        </div>
      </>
    );
  }

  const status = statusConfig[order.status] || statusConfig.pending;

  return (
    <>
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link href="/orders" className="inline-flex items-center gap-2 text-sm font-bold text-[#393939] hover:text-black mb-6">
          <ArrowLeft className="w-4 h-4" /> Volver a Órdenes
        </Link>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Header */}
            <div className="bg-white border-4 border-black rounded-xl p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <span className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-bold border-2 border-black ${status.color}`}>
                  {status.icon} {status.label}
                </span>
                <span className="text-sm font-bold text-[#2775CA]">${order.amount_usdc} USDC</span>
              </div>
              <h1 className="text-[24px] md:text-[32px] font-bold leading-tight mb-2">
                {order.service?.titulo || "Servicio"}
              </h1>
              <p className="text-[#393939] text-sm font-medium line-clamp-3">
                {order.service?.descripcion}
              </p>
            </div>

            {/* Action Bar */}
            {isParty && (
              <div className="bg-white border-4 border-black rounded-xl p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                {/* Client: Pay USDC (pending, no tx_signature) */}
                {isClient && order.status === "pending" && !order.tx_signature && (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="flex-1">
                      <p className="font-bold">💰 Pago pendiente</p>
                      <p className="text-sm text-[#393939]">Deposita ${order.amount_usdc} USDC en escrow para iniciar el trabajo.</p>
                    </div>
                    {connected ? (
                      <button onClick={handlePayEscrow} disabled={actionLoading}
                        className="bg-[#9945FF] text-white border-4 border-black rounded-xl px-6 py-3 font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-40">
                        {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Wallet className="w-5 h-5 inline mr-2" />Pagar ${order.amount_usdc} USDC</>}
                      </button>
                    ) : (
                      <div className="bg-[#F5F5F5] border-2 border-black/10 rounded-lg px-4 py-2 text-sm font-bold text-[#393939]">
                        Conecta tu wallet para pagar
                      </div>
                    )}
                  </div>
                )}

                {/* Freelancer sees pending payment message */}
                {isFreelancer && order.status === "pending" && !order.tx_signature && (
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-orange-500" />
                    <div>
                      <p className="font-bold">Esperando pago del cliente</p>
                      <p className="text-sm text-[#393939]">El cliente debe depositar ${order.amount_usdc} USDC en escrow.</p>
                    </div>
                  </div>
                )}

                {/* Freelancer: Accept (pending with tx or in_progress) */}
                {isFreelancer && (order.status === "pending" || order.status === "in_progress") && !order.accepted_at && order.tx_signature && (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="flex-1">
                      <p className="font-bold">¿Aceptas esta orden?</p>
                      <p className="text-sm text-[#393939]">Tienes <span className="font-bold text-orange-600">{getAcceptanceDeadline()}</span> para aceptar.</p>
                    </div>
                    <button onClick={handleAccept} disabled={actionLoading}
                      className="bg-black text-white border-4 border-black rounded-xl px-6 py-3 font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-40">
                      {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Aceptar Orden"}
                    </button>
                  </div>
                )}

                {/* Freelancer: Deliver (accepted or in_progress with accepted_at) */}
                {isFreelancer && (order.status === "accepted" || (order.status === "in_progress" && order.accepted_at)) && (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="flex-1">
                      <p className="font-bold">Entrega del trabajo</p>
                      <p className="text-sm text-[#393939]">Cuando termines, marca la orden como entregada.</p>
                    </div>
                    <button onClick={handleDeliver} disabled={actionLoading}
                      className="bg-ve-yellow text-black border-4 border-black rounded-xl px-6 py-3 font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-40">
                      {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Marcar Entregado"}
                    </button>
                  </div>
                )}

                {/* Client: Approve (delivered) */}
                {isClient && order.status === "delivered" && !showRating && (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="flex-1">
                      <p className="font-bold">El freelancer entregó el trabajo</p>
                      <p className="text-sm text-[#393939]">Revisa y aprueba para liberar el pago.</p>
                    </div>
                    <button onClick={handleApproveAndRate} disabled={actionLoading}
                      className="bg-[#9945FF] text-white border-4 border-black rounded-xl px-6 py-3 font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-40">
                      Aprobar y Calificar
                    </button>
                  </div>
                )}

                {/* Rating Modal - Multi-step */}
                {showRating && isClient && (
                  <div className="bg-[#FAFAFA] border-3 border-black rounded-xl p-5 space-y-5">
                    {/* Progress dots */}
                    <div className="flex items-center justify-center gap-2 mb-2">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <div key={s} className={`w-2.5 h-2.5 rounded-full border-2 border-black transition-colors ${
                          s === reviewStep ? "bg-[#9945FF]" : s < reviewStep ? "bg-black" : "bg-white"
                        }`} />
                      ))}
                    </div>

                    {/* Step 1: Stars */}
                    {reviewStep === 1 && (
                      <div className="text-center space-y-3">
                        <p className="font-bold text-lg">¿Cómo calificas al freelancer?</p>
                        <div className="flex justify-center gap-3">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <button key={s} onClick={() => setRating(s)} className="transition-transform hover:scale-125">
                              <Star className={`w-10 h-10 ${s <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
                            </button>
                          ))}
                        </div>
                        <p className="text-sm text-[#393939] font-bold">{rating === 5 ? "¡Excelente!" : rating === 4 ? "Muy bien" : rating === 3 ? "Aceptable" : rating === 2 ? "Regular" : "Malo"}</p>
                      </div>
                    )}

                    {/* Step 2: On time */}
                    {reviewStep === 2 && (
                      <div className="text-center space-y-4">
                        <p className="font-bold text-lg">¿Entregó a tiempo?</p>
                        <p className="text-sm text-[#393939]">El freelancer cumplió con el plazo de entrega acordado.</p>
                        <div className="flex justify-center gap-4">
                          <button onClick={() => setOnTime(true)}
                            className={`px-8 py-3 rounded-xl border-3 border-black font-bold text-sm transition-all ${
                              onTime === true ? "bg-green-500 text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]" : "bg-white hover:bg-green-50"
                            }`}>✅ Sí, a tiempo</button>
                          <button onClick={() => setOnTime(false)}
                            className={`px-8 py-3 rounded-xl border-3 border-black font-bold text-sm transition-all ${
                              onTime === false ? "bg-red-500 text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]" : "bg-white hover:bg-red-50"
                            }`}>❌ No</button>
                        </div>
                      </div>
                    )}

                    {/* Step 3: As expected */}
                    {reviewStep === 3 && (
                      <div className="text-center space-y-4">
                        <p className="font-bold text-lg">¿Fue lo que esperabas?</p>
                        <p className="text-sm text-[#393939]">El resultado coincide con lo que solicitaste.</p>
                        <div className="flex justify-center gap-4">
                          <button onClick={() => setAsExpected(true)}
                            className={`px-8 py-3 rounded-xl border-3 border-black font-bold text-sm transition-all ${
                              asExpected === true ? "bg-green-500 text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]" : "bg-white hover:bg-green-50"
                            }`}>✅ Sí, perfecto</button>
                          <button onClick={() => setAsExpected(false)}
                            className={`px-8 py-3 rounded-xl border-3 border-black font-bold text-sm transition-all ${
                              asExpected === false ? "bg-red-500 text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]" : "bg-white hover:bg-red-50"
                            }`}>❌ No del todo</button>
                        </div>
                      </div>
                    )}

                    {/* Step 4: Recommend */}
                    {reviewStep === 4 && (
                      <div className="text-center space-y-4">
                        <p className="font-bold text-lg">¿Lo recomiendas en Wira?</p>
                        <p className="text-sm text-[#393939]">Otros usuarios verán tu recomendación.</p>
                        <div className="flex justify-center gap-4">
                          <button onClick={() => setRecommend(true)}
                            className={`px-8 py-3 rounded-xl border-3 border-black font-bold text-sm transition-all ${
                              recommend === true ? "bg-[#9945FF] text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]" : "bg-white hover:bg-purple-50"
                            }`}>👍 Sí, lo recomiendo</button>
                          <button onClick={() => setRecommend(false)}
                            className={`px-8 py-3 rounded-xl border-3 border-black font-bold text-sm transition-all ${
                              recommend === false ? "bg-gray-500 text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]" : "bg-white hover:bg-gray-50"
                            }`}>👎 No</button>
                        </div>
                      </div>
                    )}

                    {/* Step 5: Comment */}
                    {reviewStep === 5 && (
                      <div className="space-y-3">
                        <p className="font-bold text-lg text-center">Deja tu reseña pública</p>
                        <p className="text-sm text-[#393939] text-center">Este mensaje lo verán otros usuarios en la plataforma.</p>
                        <textarea value={comment} onChange={(e) => setComment(e.target.value)}
                          placeholder="Escribe tu experiencia con este freelancer..."
                          rows={4}
                          className="w-full border-3 border-black rounded-lg px-4 py-3 text-sm font-medium placeholder:text-gray-400 focus:outline-none focus:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-shadow resize-none" />
                        {/* Summary */}
                        <div className="bg-white border-2 border-black/10 rounded-lg p-3 grid grid-cols-2 gap-2 text-xs">
                          <div className="flex items-center gap-1"><Star className="w-3 h-3 fill-yellow-400 text-yellow-400" /> <span className="font-bold">{rating}/5</span></div>
                          <div className="flex items-center gap-1">{onTime ? "✅" : "❌"} <span className="font-bold">{onTime ? "A tiempo" : "Retraso"}</span></div>
                          <div className="flex items-center gap-1">{asExpected ? "✅" : "❌"} <span className="font-bold">{asExpected ? "Como esperaba" : "No esperado"}</span></div>
                          <div className="flex items-center gap-1">{recommend ? "👍" : "👎"} <span className="font-bold">{recommend ? "Recomienda" : "No recomienda"}</span></div>
                        </div>
                      </div>
                    )}

                    {/* Navigation */}
                    <div className="flex gap-3">
                      {reviewStep > 1 ? (
                        <button onClick={() => setReviewStep(reviewStep - 1)}
                          className="flex-1 bg-white text-black border-3 border-black rounded-xl py-3 font-bold hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all">
                          ← Atrás
                        </button>
                      ) : (
                        <button onClick={() => { setShowRating(false); setReviewStep(1); }}
                          className="flex-1 bg-white text-black border-3 border-black rounded-xl py-3 font-bold hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all">
                          Cancelar
                        </button>
                      )}
                      {reviewStep < 5 ? (
                        <button onClick={() => setReviewStep(reviewStep + 1)}
                          disabled={reviewStep === 2 && onTime === null || reviewStep === 3 && asExpected === null || reviewStep === 4 && recommend === null}
                          className="flex-1 bg-black text-white border-3 border-black rounded-xl py-3 font-bold shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-30">
                          Siguiente →
                        </button>
                      ) : (
                        <button onClick={submitApproval} disabled={actionLoading}
                          className="flex-1 bg-[#9945FF] text-white border-4 border-black rounded-xl py-3 font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-40">
                          {actionLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : `Aprobar y Enviar (${rating}★)`}
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Completed + Review */}
                {order.status === "completed" && review && (
                  <div>
                    <p className="font-bold mb-2">Calificación</p>
                    <div className="flex items-center gap-2 mb-2">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className={`w-5 h-5 ${s <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
                      ))}
                      <span className="text-sm font-bold ml-1">{review.rating}/5</span>
                    </div>
                    {review.comment && <p className="text-sm text-[#393939] font-medium">{review.comment}</p>}
                  </div>
                )}

                {order.status === "completed" && !review && (
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <p className="font-bold text-green-700">Orden completada — USDC liberado al freelancer</p>
                  </div>
                )}

                {/* Invoice download */}
                {(order.status === "completed" || order.status === "delivered") && (
                  <button onClick={() => {
                    const inv = window.open('', '_blank');
                    if (!inv) return;
                    const date = new Date(order.created_at).toLocaleDateString('es-VE', { year: 'numeric', month: 'long', day: 'numeric' });
                    const completedDate = order.status === 'completed' ? new Date().toLocaleDateString('es-VE', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Pendiente';
                    inv.document.write(`<!DOCTYPE html><html><head><title>Factura - ${order.id.slice(0,8)}</title><style>
                      body{font-family:system-ui,sans-serif;max-width:700px;margin:40px auto;padding:20px;color:#111}
                      .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:30px;border-bottom:3px solid #000;padding-bottom:20px}
                      .logo{font-size:28px;font-weight:900} .badge{background:#9945FF;color:#fff;padding:4px 12px;border-radius:6px;font-size:12px;font-weight:700}
                      table{width:100%;border-collapse:collapse;margin:20px 0} th,td{text-align:left;padding:10px 12px;border-bottom:1px solid #ddd;font-size:14px}
                      th{background:#f5f5f5;font-weight:700} .total{font-size:24px;font-weight:900;color:#9945FF}
                      .footer{margin-top:40px;text-align:center;font-size:11px;color:#999;border-top:1px solid #ddd;padding-top:20px}
                      .meta{display:grid;grid-template-columns:1fr 1fr;gap:15px;margin-bottom:25px}
                      .meta-box{background:#f9f9f9;padding:15px;border-radius:8px;border:1px solid #eee}
                      .meta-box p{margin:0;font-size:13px} .meta-box strong{font-size:14px}
                      @media print{body{margin:0;padding:20px} button{display:none!important}}
                    </style></head><body>
                      <button onclick="window.print()" style="position:fixed;top:20px;right:20px;background:#000;color:#fff;border:none;padding:10px 24px;border-radius:8px;font-weight:700;cursor:pointer;font-size:14px">🖨️ Imprimir / PDF</button>
                      <div class="header"><div><div class="logo">⚫ Wira</div><p style="font-size:12px;color:#666;margin:4px 0">Marketplace Freelance · Solana</p></div><div style="text-align:right"><span class="badge">FACTURA</span><p style="font-size:12px;color:#666;margin:8px 0 0">#${order.id.slice(0,8).toUpperCase()}</p></div></div>
                      <div class="meta">
                        <div class="meta-box"><p style="color:#666">Cliente</p><strong>${order.client?.nombre || 'N/A'}</strong><p>${order.client?.email || order.client?.wallet_address?.slice(0,12) + '...' || ''}</p></div>
                        <div class="meta-box"><p style="color:#666">Freelancer</p><strong>${order.freelancer?.nombre || 'N/A'}</strong><p>${order.freelancer?.email || order.freelancer?.wallet_address?.slice(0,12) + '...' || ''}</p></div>
                        <div class="meta-box"><p style="color:#666">Fecha de orden</p><strong>${date}</strong></div>
                        <div class="meta-box"><p style="color:#666">Estado</p><strong>${order.status === 'completed' ? '✅ Completada' : '📦 Entregada'}</strong></div>
                      </div>
                      <table><thead><tr><th>Descripción</th><th>Detalles</th><th style="text-align:right">Monto</th></tr></thead><tbody>
                        <tr><td><strong>${order.service?.titulo || 'Servicio'}</strong></td><td>Entrega: ${order.service?.delivery_days || '—'} días</td><td style="text-align:right" class="total">$${order.amount_usdc.toFixed(2)}</td></tr>
                      </tbody></table>
                      <div style="text-align:right;margin-top:10px"><p style="font-size:13px;color:#666">Método de pago: <strong>USDC (Solana)</strong></p>${order.tx_signature ? '<p style="font-size:11px;color:#999;word-break:break-all">TX: '+order.tx_signature+'</p>' : ''}</div>
                      ${review ? '<div style="margin-top:25px;padding:15px;background:#f9f9f9;border-radius:8px;border:1px solid #eee"><p style="margin:0 0 5px;font-weight:700">Calificación: ' + '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating) + ' (' + review.rating + '/5)</p>' + (review.comment ? '<p style="margin:0;font-size:13px;color:#666">' + review.comment + '</p>' : '') + '</div>' : ''}
                      <div class="footer"><p>Wira · Marketplace Freelance Descentralizado · Powered by Solana</p><p>Este documento es un resumen informativo de la transacción.</p></div>
                    </body></html>`);
                    inv.document.close();
                  }}
                    className="flex items-center justify-center gap-2 w-full bg-white text-black border-3 border-black rounded-xl py-3 font-bold text-sm shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] transition-all mt-3">
                    <Download className="w-4 h-4" /> Descargar Factura
                  </button>
                )}

                {order.status === "refunded" && (
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <p className="font-bold text-red-700">Orden reembolsada</p>
                  </div>
                )}
              </div>
            )}

            {/* Chat */}
            {isParty && (
              <div
                className={`bg-white border-4 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden transition-colors ${
                  dragOver ? "border-[#9945FF] bg-purple-50" : "border-black"
                }`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
              >
                <div className="border-b-3 border-black px-5 py-3 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  <h3 className="font-bold">Chat</h3>
                  <span className="ml-auto flex items-center gap-1 text-[10px] font-bold text-green-600">
                    <ShieldAlert className="w-3 h-3" /> Escáner activo
                  </span>
                </div>
                <div className="h-[400px] overflow-y-auto p-4 space-y-3 bg-[#FAFAFA]">
                  {dragOver && (
                    <div className="flex items-center justify-center py-8 border-2 border-dashed border-[#9945FF] rounded-xl bg-purple-50">
                      <p className="text-sm font-bold text-[#9945FF]">Suelta el archivo aquí</p>
                    </div>
                  )}
                  {/* DM History */}
                  {dmHistory.length > 0 && !dragOver && (
                    <>
                      <div className="text-center py-2">
                        <span className="bg-purple-100 text-purple-700 text-[10px] font-bold px-3 py-1 rounded-full border border-purple-200">💬 Chat previo</span>
                      </div>
                      {dmHistory.map((dm) => {
                        const isMine = dm.sender_id === myProfile?.id;
                        return (
                          <div key={dm.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[75%] rounded-xl px-4 py-2.5 border-2 opacity-70 ${
                              isMine ? "bg-gray-700 text-white border-gray-600" : "bg-gray-100 text-black border-gray-200"
                            }`}>
                              <p className="text-sm font-medium whitespace-pre-wrap">{dm.content}</p>
                              <p className="text-[10px] mt-1 opacity-60">
                                {new Date(dm.created_at).toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit" })}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                      <div className="text-center py-2">
                        <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-3 py-1 rounded-full border border-blue-200">📋 Orden iniciada</span>
                      </div>
                    </>
                  )}
                  {messages.length === 0 && dmHistory.length === 0 && !dragOver && (
                    <p className="text-center text-sm text-[#393939] py-12">No hay mensajes aún. ¡Escribe el primero!</p>
                  )}
                  {messages.map((m) => {
                    const isMine = m.sender_id === myProfile?.id;
                    const isImage = m.file_type?.startsWith("image/");
                    const isPdf = m.file_type === "application/pdf";
                    return (
                      <div key={m.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[75%] rounded-xl px-4 py-2.5 border-2 ${
                          isMine ? "bg-black text-white border-black" : "bg-white text-black border-black/20"
                        }`}>
                          <p className={`text-[10px] font-bold mb-0.5 ${isMine ? "text-gray-300" : "text-[#393939]"}`}>
                            {m.sender?.nombre || "Usuario"}
                          </p>
                          {isImage && m.file_url && (
                            <a href={m.file_url} target="_blank" rel="noopener noreferrer" className="block my-1">
                              <img src={m.file_url} alt={m.file_name || ""} className="max-w-full max-h-[240px] rounded-lg border-2 border-black/10 object-cover" />
                            </a>
                          )}
                          {isPdf && m.file_url && (
                            <a href={m.file_url} target="_blank" rel="noopener noreferrer"
                              className={`flex items-center gap-2 my-1 px-3 py-2 rounded-lg border-2 ${
                                isMine ? "border-white/20 hover:bg-white/10" : "border-black/10 hover:bg-gray-50"
                              } transition-colors`}>
                              <FileText className="w-5 h-5 flex-shrink-0" />
                              <span className="text-xs font-bold truncate">{m.file_name || "documento.pdf"}</span>
                            </a>
                          )}
                          {m.content && !(isImage && !m.content.replace("📷 Imagen", "").trim()) && (
                            <p className="text-sm font-medium whitespace-pre-wrap">{m.content}</p>
                          )}
                          <p className={`text-[10px] mt-1 flex items-center gap-1 ${isMine ? "text-gray-400 justify-end" : "text-gray-400"}`}>
                            {new Date(m.created_at).toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit" })}
                            {isMine && (
                              m.read_at ? <CheckCheck className="w-3.5 h-3.5 text-[#53BDEB]" /> :
                              m.delivered_at ? <CheckCheck className="w-3.5 h-3.5" /> :
                              <Check className="w-3.5 h-3.5" />
                            )}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  {/* Typing indicator */}
                  {partnerTyping && (
                    <div className="flex justify-start">
                      <div className="bg-white border-2 border-black/20 rounded-xl px-4 py-2.5 rounded-bl-sm">
                        <div className="flex items-center gap-1">
                          <span className="w-2 h-2 bg-black rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                          <span className="w-2 h-2 bg-black rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                          <span className="w-2 h-2 bg-black rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
                {/* Upload Progress Bar */}
                {uploading && (
                  <div className="border-t-3 border-black px-4 py-3 bg-[#F5F5F5]">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 bg-[#9945FF] rounded-lg border-2 border-black flex items-center justify-center flex-shrink-0">
                        {uploadStep.includes("VirusTotal") ? (
                          <ShieldAlert className="w-4 h-4 text-white animate-pulse" />
                        ) : (
                          <Loader2 className="w-4 h-4 text-white animate-spin" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold truncate">{uploadFileName}</p>
                        <p className="text-[10px] font-bold text-[#9945FF]">{uploadStep}</p>
                      </div>
                      <span className="text-xs font-bold text-[#393939]">{uploadProgress}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full border border-black/10 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500 ease-out"
                        style={{
                          width: `${uploadProgress}%`,
                          background: uploadStep.includes("VirusTotal")
                            ? "linear-gradient(90deg, #9945FF, #14F195)"
                            : "#9945FF",
                        }}
                      />
                    </div>
                  </div>
                )}
                {/* Input */}
                {["pending", "accepted", "in_progress", "delivered"].includes(order.status) && (
                  <form onSubmit={handleSendMessage} className="border-t-3 border-black flex items-center">
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*,.pdf"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); e.target.value = ""; }} />
                    <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}
                      className="px-3 py-3 text-[#393939] hover:text-black transition-colors disabled:opacity-30"
                      title="Adjuntar imagen o PDF">
                      {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Paperclip className="w-5 h-5" />}
                    </button>
                    <input type="text" value={msgInput} onChange={(e) => { setMsgInput(e.target.value); handleOrderTyping(); }}
                      placeholder={uploading ? "Procesando archivo..." : "Escribe un mensaje..."}
                      className="flex-1 px-2 py-3 text-sm font-medium focus:outline-none" disabled={sending || uploading} />
                    <button type="submit" disabled={sending || uploading || !msgInput.trim()}
                      className="px-5 py-3 bg-black text-white font-bold disabled:opacity-30 transition-opacity">
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Order Info */}
            <div className="bg-white border-4 border-black rounded-xl p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <h3 className="font-bold mb-4">Detalles</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#393939]" />
                  <span className="font-medium">{order.tx_signature ? `$${order.amount_usdc} USDC en escrow` : `$${order.amount_usdc} USDC — Pago pendiente`}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#393939]" />
                  <span className="font-medium">{order.service?.delivery_days || "?"} días de entrega</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#393939]" />
                  <span className="font-medium">Creada: {new Date(order.created_at).toLocaleDateString("es-VE")}</span>
                </div>
                {order.tx_signature && (
                  <a
                    href={`https://explorer.solana.com/tx/${order.tx_signature}?cluster=devnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[#9945FF] font-bold text-xs hover:underline"
                  >
                    Ver en Solana Explorer →
                  </a>
                )}
              </div>
            </div>

            {/* Freelancer Card */}
            <div className="bg-white border-4 border-black rounded-xl p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <h3 className="font-bold mb-3">Freelancer</h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#9945FF] rounded-lg border-2 border-black flex items-center justify-center text-white font-bold">
                  {order.freelancer?.nombre?.charAt(0).toUpperCase() || "?"}
                </div>
                <div>
                  <p className="font-bold text-sm">{order.freelancer?.nombre || "Freelancer"}</p>
                  {order.freelancer?.categoria && (
                    <span className="text-[10px] font-bold text-[#393939]">{order.freelancer.categoria}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Client Card */}
            <div className="bg-white border-4 border-black rounded-xl p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <h3 className="font-bold mb-3">Cliente</h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-ve-blue rounded-lg border-2 border-black flex items-center justify-center text-white font-bold">
                  {order.client?.nombre?.charAt(0).toUpperCase() || "?"}
                </div>
                <div>
                  <p className="font-bold text-sm">{order.client?.nombre || "Cliente"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
