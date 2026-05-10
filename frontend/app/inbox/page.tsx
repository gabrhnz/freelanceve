"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { useSession } from "@/contexts/session-context";
import { Navigation } from "@/components/navigation";
import {
  getProfileByEmail, getProfileByWallet, getProfileById,
  getOrdersByUser, getMessagesByOrder,
  getConversationPartners, getDirectMessages,
  Order, Profile, Message, DirectMessage,
} from "@/lib/supabase";
import {
  MessageSquare, Wallet, FileText, ArrowRight,
} from "lucide-react";

// ----- Unified conversation item -----
interface ConversationItem {
  key: string;
  type: "order" | "dm";
  // order convos
  order?: Order;
  lastOrderMsg?: Message | null;
  // dm convos
  partner?: Profile | null;
  lastDM?: DirectMessage | null;
  // shared
  lastTime: number;
  counterpart: Profile | null;
}

export default function InboxPage() {
  const { publicKey } = useWallet();
  const { user, loading: sessionLoading } = useSession();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    let p: Profile | null = null;
    if (user?.email) p = await getProfileByEmail(user.email);
    if (!p && publicKey) p = await getProfileByWallet(publicKey.toBase58());
    setProfile(p);
    if (!p) { setLoading(false); return; }

    const items: ConversationItem[] = [];

    // ── 1. ORDER CONVERSATIONS ───────────────────────────────────────────────
    const orders = await getOrdersByUser(p.id);

    for (const order of orders) {
      const msgs = await getMessagesByOrder(order.id);
      const lastMsg = msgs.length > 0 ? msgs[msgs.length - 1] : null;
      const isFreelancer = order.freelancer_id === p.id;
      const counterpart = isFreelancer
        ? (order.client as Profile) || null
        : (order.freelancer as Profile) || null;

      items.push({
        key: `order-${order.id}`,
        type: "order",
        order,
        lastOrderMsg: lastMsg,
        lastTime: lastMsg
          ? new Date(lastMsg.created_at).getTime()
          : new Date(order.created_at).getTime(),
        counterpart,
      });
    }

    // ── 2. DIRECT MESSAGE CONVERSATIONS ─────────────────────────────────────
    const partnerMap = await getConversationPartners(p.id);

    for (const [partnerId, lastMsgDate] of Array.from(partnerMap.entries())) {
      // Skip if we already have an order convo with this same person
      // (they will appear in the DM section anyway for pre-order chats)
      const partner = await getProfileById(partnerId);
      const dmThread = await getDirectMessages(p.id, partnerId);
      const lastDM = dmThread.length > 0 ? dmThread[dmThread.length - 1] : null;

      items.push({
        key: `dm-${partnerId}`,
        type: "dm",
        partner,
        lastDM,
        lastTime: new Date(lastMsgDate).getTime(),
        counterpart: partner,
      });
    }

    // ── 3. Sort by most recent ───────────────────────────────────────────────
    items.sort((a, b) => b.lastTime - a.lastTime);

    setConversations(items);
    setLoading(false);
  }, [user?.email, publicKey]);

  useEffect(() => {
    if (!sessionLoading || publicKey) fetchData();
  }, [sessionLoading, publicKey, fetchData]);

  // Poll every 10s
  useEffect(() => {
    if (!profile) return;
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [profile, fetchData]);

  const isOnline = (lastSeen: string | null) => {
    if (!lastSeen) return false;
    return Date.now() - new Date(lastSeen).getTime() < 24 * 60 * 60 * 1000;
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "ahora";
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  const orderStatusLabel = (status: string) => {
    if (status === "completed") return { icon: "✓", cls: "bg-green-100 text-green-700" };
    if (status === "delivered") return { icon: "📦", cls: "bg-yellow-100 text-yellow-700" };
    if (status === "pending")   return { icon: "⏳", cls: "bg-gray-100 text-gray-600" };
    return { icon: "💬", cls: "bg-blue-100 text-blue-700" };
  };

  if (!publicKey && !user) {
    return (
      <>
        <Navigation />
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="bg-white border-4 border-black rounded-xl p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-center max-w-md mx-4">
            <Wallet className="w-12 h-12 mx-auto mb-4" />
            <p className="text-xl font-bold mb-2">Conecta tu wallet</p>
            <p className="text-[#393939]">Para ver tus mensajes necesitas iniciar sesión.</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-3xl space-y-6 min-h-[80vh]">
        <div className="flex items-center justify-between">
          <h1 className="text-[32px] md:text-[42px] font-bold leading-tight">
            <span className="bg-ve-yellow px-2">Inbox</span>
          </h1>
          <span className="text-sm font-bold text-[#393939]">
            {conversations.length} conversaci{conversations.length !== 1 ? "ones" : "ón"}
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-black border-t-transparent" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="bg-[#F5F5F5] border-4 border-black/10 rounded-xl p-12 text-center">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-bold text-[#393939]">No tienes conversaciones aún</p>
            <p className="text-sm text-[#393939] mt-1">
              Las conversaciones aparecerán aquí cuando tengas órdenes o chats directos.
            </p>
            <Link
              href="/marketplace"
              className="inline-flex items-center gap-2 mt-6 bg-black text-white border-3 border-black rounded-lg px-5 py-2.5 font-bold text-sm shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
            >
              Explorar Marketplace <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((c) => {
              const online = isOnline(c.counterpart?.last_seen || null);

              // ── ORDER item ──────────────────────────────────────────────
              if (c.type === "order" && c.order) {
                const isFile = c.lastOrderMsg?.file_url;
                const isMySentMsg = c.lastOrderMsg?.sender_id === profile?.id;
                const msgPreview = c.lastOrderMsg
                  ? isFile && !c.lastOrderMsg.content?.trim()
                    ? `${isMySentMsg ? "Tú: " : ""}📎 Archivo adjunto`
                    : `${isMySentMsg ? "Tú: " : ""}${c.lastOrderMsg.content?.slice(0, 70) || "📎 Archivo"}`
                  : "Sin mensajes aún";
                const badge = orderStatusLabel(c.order.status);

                return (
                  <Link key={c.key} href={`/orders/${c.order.id}`}>
                    <div className="bg-white border-4 border-black rounded-xl p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] transition-shadow cursor-pointer">
                      <div className="flex items-center gap-3">
                        {/* Avatar */}
                        <div className="relative flex-shrink-0">
                          <div className="w-12 h-12 rounded-xl border-2 border-black bg-[#9945FF] flex items-center justify-center text-white font-bold text-lg overflow-hidden">
                            {c.counterpart?.avatar_url ? (
                              <img src={c.counterpart.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              c.counterpart?.nombre?.charAt(0).toUpperCase() || "?"
                            )}
                          </div>
                          <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${online ? "bg-green-500" : "bg-gray-300"}`} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-bold text-sm truncate">{c.counterpart?.nombre || "Usuario"}</p>
                            <span className="text-[10px] font-bold text-[#393939] flex-shrink-0">
                              {c.lastOrderMsg ? timeAgo(c.lastOrderMsg.created_at) : ""}
                            </span>
                          </div>
                          <p className="text-xs text-[#393939] font-medium truncate mt-0.5">
                            📋 {c.order.service?.titulo || "Orden"}
                          </p>
                          <p className="text-xs text-[#393939] truncate mt-0.5 flex items-center gap-1">
                            {isFile && <FileText className="w-3 h-3 flex-shrink-0" />}
                            {msgPreview}
                          </p>
                        </div>

                        {/* Badge */}
                        <div className="flex-shrink-0">
                          <span className={`rounded-lg px-2 py-0.5 text-[10px] font-bold border border-black/20 ${badge.cls}`}>
                            {badge.icon}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              }

              // ── DIRECT MESSAGE item ─────────────────────────────────────
              const lastDM = c.lastDM;
              const isMyMsg = lastDM?.sender_id === profile?.id;
              const dmPreview = lastDM
                ? lastDM.file_url && !lastDM.content?.trim()
                  ? "📎 Archivo adjunto"
                  : `${isMyMsg ? "Tú: " : ""}${lastDM.content?.slice(0, 70) || "📎 Archivo"}`
                : "Sin mensajes aún";

              return (
                <Link key={c.key} href={`/chat/${c.counterpart?.id}`}>
                  <div className="bg-white border-4 border-black rounded-xl p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] transition-shadow cursor-pointer">
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className="relative flex-shrink-0">
                        <div className="w-12 h-12 rounded-xl border-2 border-black bg-[#14F195] flex items-center justify-center text-black font-bold text-lg overflow-hidden">
                          {c.counterpart?.avatar_url ? (
                            <img src={c.counterpart.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            c.counterpart?.nombre?.charAt(0).toUpperCase() || "?"
                          )}
                        </div>
                        <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${online ? "bg-green-500" : "bg-gray-300"}`} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-bold text-sm truncate">{c.counterpart?.nombre || "Usuario"}</p>
                          <span className="text-[10px] font-bold text-[#393939] flex-shrink-0">
                            {lastDM ? timeAgo(lastDM.created_at) : ""}
                          </span>
                        </div>
                        <p className="text-xs text-[#393939] font-medium truncate mt-0.5">
                          💬 Chat directo
                        </p>
                        <p className="text-xs text-[#393939] truncate mt-0.5">{dmPreview}</p>
                      </div>

                      {/* Badge */}
                      <div className="flex-shrink-0">
                        <span className="rounded-lg px-2 py-0.5 text-[10px] font-bold border border-black/20 bg-purple-100 text-purple-700">
                          DM
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
