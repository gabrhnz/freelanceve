import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ----- Types -----

export interface SocialLinks {
  twitter?: string;
  instagram?: string;
  github?: string;
  linkedin?: string;
  website?: string;
  telegram?: string;
}

export interface PortfolioItem {
  title: string;
  url: string;
  description?: string;
  file_url?: string;
  file_type?: string;
  thumbnail?: string;
}

export interface Profile {
  id: string;
  email: string | null;
  wallet_address: string | null;
  nombre: string;
  username: string | null;
  bio: string | null;
  role: "freelancer" | "employer" | "both";
  categoria: string | null;
  skills: string[];
  avatar_url: string | null;
  social_links: SocialLinks | null;
  portfolio: PortfolioItem[] | null;
  last_seen: string | null;
  blocked_at?: string | null;
  created_at: string;
}

export interface Service {
  id: string;
  owner_id: string;
  titulo: string;
  descripcion: string;
  precio_usdc: number;
  delivery_days: number;
  categoria: string;
  activo: boolean;
  youtube_url?: string | null;
  images?: string[] | null;
  created_at: string;
  // joined
  owner?: Profile;
}

export interface Order {
  id: string;
  service_id: string;
  client_id: string;
  freelancer_id: string;
  amount_usdc: number;
  status: "pending" | "accepted" | "in_progress" | "delivered" | "completed" | "refunded" | "cancelled";
  tx_signature: string | null;
  accepted_at: string | null;
  created_at: string;
  // joined
  service?: Service;
  client?: Profile;
  freelancer?: Profile;
}

export interface Message {
  id: string;
  order_id: string;
  sender_id: string;
  content: string;
  file_url: string | null;
  file_name: string | null;
  file_type: string | null;
  delivered_at?: string | null;
  read_at?: string | null;
  created_at: string;
  // joined
  sender?: Profile;
}

export interface Review {
  id: string;
  order_id: string;
  reviewer_id: string;
  freelancer_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  // joined
  reviewer?: Profile;
}

// ----- Profile helpers -----

export async function getProfileByEmail(email: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("email", email)
    .single();
  if (error && error.code !== "PGRST116") console.error(error);
  return data as Profile | null;
}

export async function getProfileById(id: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();
  if (error) console.error(error);
  return data as Profile | null;
}

export async function getProfileByWallet(wallet: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("wallet_address", wallet)
    .single();
  if (error && error.code !== "PGRST116") console.error(error);
  return data as Profile | null;
}

export async function upsertProfile(profile: Partial<Profile> & { email?: string | null; wallet_address?: string | null }) {
  // Decide conflict key based on available identifier
  let onConflict = "email";
  if (!profile.email && profile.wallet_address) {
    onConflict = "wallet_address";
  }
  const { data, error } = await supabase
    .from("profiles")
    .upsert(profile, { onConflict })
    .select()
    .single();
  if (error) console.error(error);
  return data as Profile | null;
}

export async function updateProfileById(id: string, updates: Partial<Profile>) {
  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) {
    console.error("updateProfileById error:", error);
    return null;
  }
  return data as Profile | null;
}

export async function getProfileByUsername(username: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .single();
  if (error && error.code !== "PGRST116") console.error(error);
  return data as Profile | null;
}

// ----- Service helpers -----

export async function getServices(filters?: { categoria?: string; search?: string }) {
  let query = supabase
    .from("services")
    .select("*, owner:profiles(*)")
    .eq("activo", true)
    .order("created_at", { ascending: false });

  if (filters?.categoria && filters.categoria !== "all") {
    query = query.eq("categoria", filters.categoria);
  }
  if (filters?.search) {
    query = query.or(`titulo.ilike.%${filters.search}%,descripcion.ilike.%${filters.search}%`);
  }

  const { data, error } = await query;
  if (error) console.error(error);
  return (data || []) as Service[];
}

export async function getServiceById(id: string) {
  const { data, error } = await supabase
    .from("services")
    .select("*, owner:profiles(*)")
    .eq("id", id)
    .single();
  if (error) console.error(error);
  return data as Service | null;
}

export async function getServicesByOwner(ownerId: string) {
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });
  if (error) console.error(error);
  return (data || []) as Service[];
}

export async function createService(service: Omit<Service, "id" | "created_at" | "owner">) {
  const { data, error } = await supabase
    .from("services")
    .insert(service)
    .select()
    .single();
  if (error) console.error(error);
  return data as Service | null;
}

export async function updateService(id: string, updates: Partial<Service>) {
  const { data, error } = await supabase
    .from("services")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) console.error(error);
  return data as Service | null;
}

export async function deleteService(id: string) {
  const { error } = await supabase
    .from("services")
    .delete()
    .eq("id", id);
  if (error) {
    console.error(error);
    return false;
  }
  return true;
}

// ----- Order helpers -----

export async function getOrdersByUser(userId: string) {
  const { data, error } = await supabase
    .from("orders")
    .select("*, service:services(*), client:profiles!orders_client_id_fkey(*), freelancer:profiles!orders_freelancer_id_fkey(*)")
    .or(`client_id.eq.${userId},freelancer_id.eq.${userId}`)
    .order("created_at", { ascending: false });
  if (error) console.error(error);
  return (data || []) as Order[];
}

export async function createOrder(order: Omit<Order, "id" | "created_at" | "service" | "client" | "freelancer">) {
  const { data, error } = await supabase
    .from("orders")
    .insert(order)
    .select()
    .single();
  if (error) console.error(error);
  return data as Order | null;
}

export async function updateOrderStatus(id: string, status: Order["status"], txSignature?: string) {
  const updates: Partial<Order> = { status };
  if (txSignature) updates.tx_signature = txSignature;
  const { data, error } = await supabase
    .from("orders")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) console.error(error);
  return data as Order | null;
}

export async function getOrderById(id: string) {
  const { data, error } = await supabase
    .from("orders")
    .select("*, service:services(*, owner:profiles(*)), client:profiles!orders_client_id_fkey(*), freelancer:profiles!orders_freelancer_id_fkey(*)")
    .eq("id", id)
    .single();
  if (error) console.error(error);
  return data as Order | null;
}

export async function acceptOrder(id: string) {
  const { data, error } = await supabase
    .from("orders")
    .update({ status: "accepted", accepted_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) console.error(error);
  return data as Order | null;
}

// ----- Message helpers -----

export async function getMessagesByOrder(orderId: string) {
  const { data, error } = await supabase
    .from("messages")
    .select("*, sender:profiles(*)")
    .eq("order_id", orderId)
    .order("created_at", { ascending: true });
  if (error) console.error(error);
  return (data || []) as Message[];
}

export async function sendMessage(
  orderId: string,
  senderId: string,
  content: string,
  file?: { url: string; name: string; type: string }
) {
  const row: any = { order_id: orderId, sender_id: senderId, content };
  if (file) {
    row.file_url = file.url;
    row.file_name = file.name;
    row.file_type = file.type;
  }
  const { data, error } = await supabase
    .from("messages")
    .insert(row)
    .select("*, sender:profiles(*)")
    .single();
  if (error) console.error(error);
  return data as Message | null;
}

export async function markOrderMessagesDelivered(messageIds: string[]) {
  if (messageIds.length === 0) return;
  const { error } = await supabase
    .from("messages")
    .update({ delivered_at: new Date().toISOString() })
    .in("id", messageIds)
    .is("delivered_at", null);
  if (error) console.error(error);
}

export async function markOrderMessagesRead(orderId: string, readerId: string) {
  const { error } = await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("order_id", orderId)
    .neq("sender_id", readerId)
    .is("read_at", null);
  if (error) console.error(error);
}

export function subscribeToOrderMessages(
  orderId: string,
  onNewMessage: (msg: Message) => void,
  onUpdate: (msg: Message) => void
) {
  const channel = supabase
    .channel(`order-msgs-${orderId}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "messages", filter: `order_id=eq.${orderId}` },
      (payload) => onNewMessage(payload.new as Message)
    )
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "messages", filter: `order_id=eq.${orderId}` },
      (payload) => onUpdate(payload.new as Message)
    )
    .subscribe();
  return channel;
}

// ----- Review helpers -----

export async function getReviewByOrder(orderId: string) {
  const { data, error } = await supabase
    .from("reviews")
    .select("*, reviewer:profiles!reviews_reviewer_id_fkey(*)")
    .eq("order_id", orderId)
    .single();
  if (error && error.code !== "PGRST116") console.error(error);
  return data as Review | null;
}

export async function createReview(review: { order_id: string; reviewer_id: string; freelancer_id: string; rating: number; comment?: string }) {
  const { data, error } = await supabase
    .from("reviews")
    .insert(review)
    .select()
    .single();
  if (error) console.error(error);
  return data as Review | null;
}

export async function getReviewsByFreelancer(freelancerId: string) {
  const { data, error } = await supabase
    .from("reviews")
    .select("*, reviewer:profiles!reviews_reviewer_id_fkey(*)")
    .eq("freelancer_id", freelancerId)
    .order("created_at", { ascending: false });
  if (error) console.error(error);
  return (data || []) as Review[];
}

// ----- Storage helpers -----

export async function uploadFileToStorage(file: File): Promise<string | null> {
  const ext = file.name.split(".").pop() || "bin";
  const fileName = `chat-files/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { data, error } = await supabase.storage
    .from("attachments")
    .upload(fileName, file, {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    console.error("Storage upload error:", error);
    return null;
  }

  const { data: urlData } = supabase.storage
    .from("attachments")
    .getPublicUrl(fileName);

  return urlData.publicUrl;
}

// ----- Admin helpers -----

export async function getAllOrders(statusFilter?: string) {
  let query = supabase
    .from("orders")
    .select("*, service:services(titulo), freelancer:profiles!orders_freelancer_id_fkey(*), client:profiles!orders_client_id_fkey(*)")
    .order("created_at", { ascending: false });
  if (statusFilter && statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }
  const { data, error } = await query;
  if (error) console.error(error);
  return (data || []) as Order[];
}

export async function getAllProfiles() {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) console.error(error);
  return (data || []) as Profile[];
}

export async function getAllServices() {
  const { data, error } = await supabase
    .from("services")
    .select("*, owner:profiles(*)")
    .order("created_at", { ascending: false });
  if (error) console.error(error);
  return (data || []) as any[];
}

// ----- Direct Messages helpers -----

export interface DirectMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  file_url?: string;
  file_name?: string;
  read: boolean;
  delivered_at?: string | null;
  read_at?: string | null;
  created_at: string;
  sender?: Profile;
  receiver?: Profile;
}

export async function getDirectMessages(userId1: string, userId2: string) {
  const { data, error } = await supabase
    .from("direct_messages")
    .select("*, sender:profiles!direct_messages_sender_id_fkey(*), receiver:profiles!direct_messages_receiver_id_fkey(*)")
    .or(`and(sender_id.eq.${userId1},receiver_id.eq.${userId2}),and(sender_id.eq.${userId2},receiver_id.eq.${userId1})`)
    .order("created_at", { ascending: true });
  if (error) console.error(error);
  return (data || []) as DirectMessage[];
}

export async function sendDirectMessage(senderId: string, receiverId: string, content: string, fileUrl?: string, fileName?: string) {
  const { data, error } = await supabase
    .from("direct_messages")
    .insert({ sender_id: senderId, receiver_id: receiverId, content, file_url: fileUrl, file_name: fileName })
    .select()
    .single();
  if (error) console.error(error);
  return data as DirectMessage | null;
}

export async function markMessagesDelivered(messageIds: string[]) {
  if (messageIds.length === 0) return;
  const { error } = await supabase
    .from("direct_messages")
    .update({ delivered_at: new Date().toISOString() })
    .in("id", messageIds)
    .is("delivered_at", null);
  if (error) console.error(error);
}

export async function markMessagesRead(receiverId: string, senderId: string) {
  const { error } = await supabase
    .from("direct_messages")
    .update({ read_at: new Date().toISOString() })
    .eq("receiver_id", receiverId)
    .eq("sender_id", senderId)
    .is("read_at", null);
  if (error) console.error(error);
}

export async function upsertTypingStatus(userId: string, chatPartnerId: string, isTyping: boolean) {
  const { error } = await supabase
    .from("typing_status")
    .upsert(
      { user_id: userId, chat_partner_id: chatPartnerId, is_typing: isTyping, updated_at: new Date().toISOString() },
      { onConflict: "user_id,chat_partner_id" }
    );
  if (error) console.error(error);
}

export function subscribeToDirectMessages(
  userId1: string,
  userId2: string,
  onNewMessage: (msg: DirectMessage) => void,
  onUpdate: (msg: DirectMessage) => void
) {
  const channel = supabase
    .channel(`dm-${[userId1, userId2].sort().join("-")}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "direct_messages",
      },
      (payload) => {
        const msg = payload.new as DirectMessage;
        // Only process messages in this conversation
        if (
          (msg.sender_id === userId1 && msg.receiver_id === userId2) ||
          (msg.sender_id === userId2 && msg.receiver_id === userId1)
        ) {
          onNewMessage(msg);
        }
      }
    )
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "direct_messages",
      },
      (payload) => {
        const msg = payload.new as DirectMessage;
        if (
          (msg.sender_id === userId1 && msg.receiver_id === userId2) ||
          (msg.sender_id === userId2 && msg.receiver_id === userId1)
        ) {
          onUpdate(msg);
        }
      }
    )
    .subscribe();
  return channel;
}

export function subscribeToTypingStatus(
  myId: string,
  partnerId: string,
  onTyping: (isTyping: boolean) => void
) {
  const channel = supabase
    .channel(`typing-${partnerId}-${myId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "typing_status",
        filter: `user_id=eq.${partnerId}`,
      },
      (payload) => {
        const row = payload.new as any;
        if (row && row.chat_partner_id === myId) {
          onTyping(row.is_typing);
        }
      }
    )
    .subscribe();
  return channel;
}

export async function getConversationPartners(userId: string) {
  // Get all unique users this person has chatted with
  const { data: sent } = await supabase
    .from("direct_messages")
    .select("receiver_id, created_at")
    .eq("sender_id", userId)
    .order("created_at", { ascending: false });
  const { data: received } = await supabase
    .from("direct_messages")
    .select("sender_id, created_at")
    .eq("receiver_id", userId)
    .order("created_at", { ascending: false });

  const partnerMap = new Map<string, string>();
  for (const m of (sent || [])) {
    if (!partnerMap.has(m.receiver_id)) partnerMap.set(m.receiver_id, m.created_at);
  }
  for (const m of (received || [])) {
    const existing = partnerMap.get(m.sender_id);
    if (!existing || new Date(m.created_at) > new Date(existing)) {
      partnerMap.set(m.sender_id, m.created_at);
    }
  }
  return partnerMap; // partnerId -> lastMessageDate
}

// ----- Reports helpers -----

export interface Report {
  id: string;
  reporter_id: string;
  reported_service_id?: string;
  reported_user_id?: string;
  reported_message_id?: string;
  reason: string;
  details?: string;
  status: string;
  created_at: string;
}

export async function createReport(report: Partial<Report>) {
  const { data, error } = await supabase
    .from("reports")
    .insert(report)
    .select()
    .single();
  if (error) console.error(error);
  return data as Report | null;
}

export async function getAllReports() {
  const { data, error } = await supabase
    .from("reports")
    .select("*, reporter:profiles!reports_reporter_id_fkey(nombre, email)")
    .order("created_at", { ascending: false });
  if (error) console.error(error);
  return (data || []) as any[];
}

// ----- Admin helpers -----

export async function blockUser(userId: string) {
  const { error } = await supabase.from("profiles").update({ blocked_at: new Date().toISOString() }).eq("id", userId);
  if (error) console.error(error);
  return !error;
}

export async function unblockUser(userId: string) {
  const { error } = await supabase.from("profiles").update({ blocked_at: null }).eq("id", userId);
  if (error) console.error(error);
  return !error;
}

export async function adminCancelOrder(orderId: string) {
  const { error } = await supabase.from("orders").update({ status: "cancelled" }).eq("id", orderId);
  if (error) console.error(error);
  return !error;
}

export async function adminRefundOrder(orderId: string) {
  const { error } = await supabase.from("orders").update({ status: "refunded" }).eq("id", orderId);
  if (error) console.error(error);
  return !error;
}
