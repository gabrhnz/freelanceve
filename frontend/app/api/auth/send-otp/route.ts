import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { generateOTP, storeOTP } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Email inválido" },
        { status: 400 }
      );
    }

    const code = generateOTP();
    storeOTP(email, code);

    // Send email via Resend
    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: process.env.EMAIL_FROM || "SolanceWork <onboarding@resend.dev>",
        to: email,
        subject: "Tu código de acceso - SolanceWork",
        html: `
          <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto; padding: 32px; border: 4px solid black; border-radius: 16px;">
            <h1 style="font-size: 24px; font-weight: 800; margin-bottom: 8px;">SolanceWork</h1>
            <p style="color: #393939; font-size: 16px;">Tu código de verificación es:</p>
            <div style="background: #F4D03F; border: 3px solid black; border-radius: 12px; padding: 16px; text-align: center; margin: 24px 0; box-shadow: 4px 4px 0px 0px rgba(0,0,0,1);">
              <span style="font-size: 32px; font-weight: 800; letter-spacing: 8px;">${code}</span>
            </div>
            <p style="color: #393939; font-size: 14px;">Este código expira en 10 minutos.</p>
            <p style="color: #999; font-size: 12px; margin-top: 24px;">Si no solicitaste este código, ignora este email.</p>
          </div>
        `,
      });
    } else {
      // Dev mode: log OTP to console
      console.log(`[DEV] OTP for ${email}: ${code}`);
    }

    return NextResponse.json({ success: true, message: "Código enviado" });
  } catch (error) {
    console.error("Error sending OTP:", error);
    return NextResponse.json(
      { error: "Error al enviar código" },
      { status: 500 }
    );
  }
}
