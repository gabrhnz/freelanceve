import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM = process.env.EMAIL_FROM || "Wira <no-reply@billete.lat>";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function POST(req: NextRequest) {
  try {
    const { type, to, data } = await req.json();

    if (!to || !type) {
      return NextResponse.json({ error: "Missing params" }, { status: 400 });
    }

    if (!resend) {
      console.log(`[DEV] Notification (${type}) to ${to}:`, data);
      return NextResponse.json({ success: true, dev: true });
    }

    let subject = "";
    let html = "";

    if (type === "new_message") {
      // Check unread message count — only send email every 3 unread messages
      if (data.senderId && data.receiverId) {
        const { count } = await getSupabase()
          .from("direct_messages")
          .select("*", { count: "exact", head: true })
          .eq("sender_id", data.senderId)
          .eq("receiver_id", data.receiverId)
          .is("read_at", null);

        const unread = count || 0;
        // Only send on every 3rd unread message (3, 6, 9...)
        if (unread % 3 !== 0 || unread === 0) {
          return NextResponse.json({ success: true, skipped: true, unread });
        }
      }

      const chatLink = data.chatUrl || data.orderUrl || "https://frontend-mauve-kappa-18.vercel.app/inbox";
      subject = `💬 Tienes mensajes sin leer — Wira`;
      html = `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; border: 4px solid black; border-radius: 16px;">
          <h1 style="font-size: 24px; font-weight: 800; margin-bottom: 8px;">Wira</h1>
          <p style="color: #393939; font-size: 16px; margin-bottom: 16px;">Tienes mensajes sin leer de <strong>${data.senderName || "un usuario"}</strong>.</p>
          <a href="${chatLink}" 
             style="display: inline-block; background: black; color: white; font-weight: 800; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-size: 14px;">
            Ver conversación →
          </a>
          <p style="color: #999; font-size: 12px; margin-top: 24px;">No respondas a este email.</p>
        </div>
      `;
    } else if (type === "new_order") {
      subject = `🎉 ¡Nueva orden recibida! — Wira`;
      html = `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; border: 4px solid black; border-radius: 16px;">
          <h1 style="font-size: 24px; font-weight: 800; margin-bottom: 8px;">Wira</h1>
          <p style="color: #393939; font-size: 16px; margin-bottom: 16px;">¡Recibiste una nueva orden!</p>
          <div style="background: #F4D03F; border: 3px solid black; border-radius: 12px; padding: 16px; margin-bottom: 16px; box-shadow: 4px 4px 0px 0px rgba(0,0,0,1);">
            <p style="font-size: 18px; font-weight: 800; margin: 0 0 4px 0;">${data.serviceTitle || "Servicio"}</p>
            <p style="font-size: 24px; font-weight: 800; color: #2775CA; margin: 0;">$${data.amount || "0"} USDC</p>
          </div>
          <p style="color: #393939; font-size: 14px; margin-bottom: 16px;">Cliente: <strong>${data.clientName || "Un cliente"}</strong></p>
          <p style="color: #393939; font-size: 14px; margin-bottom: 20px;">⏰ Tienes 24 horas para aceptar esta orden.</p>
          <a href="${data.orderUrl || "https://frontend-mauve-kappa-18.vercel.app/orders"}" 
             style="display: inline-block; background: black; color: white; font-weight: 800; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-size: 14px;">
            Ver orden →
          </a>
          <p style="color: #999; font-size: 12px; margin-top: 24px;">No respondas a este email.</p>
        </div>
      `;
    } else {
      return NextResponse.json({ error: "Unknown type" }, { status: 400 });
    }

    const { error: sendError } = await resend.emails.send({
      from: FROM,
      to,
      subject,
      html,
    });

    if (sendError) {
      console.error("Resend notification error:", sendError);
      return NextResponse.json({ error: sendError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Notification error:", error);
    return NextResponse.json({ error: "Error sending notification" }, { status: 500 });
  }
}

