import { NextRequest, NextResponse } from "next/server";
import { verifyOTP, createToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, code } = await req.json();

    if (!email || !code) {
      return NextResponse.json(
        { error: "Email y código son requeridos" },
        { status: 400 }
      );
    }

    const valid = verifyOTP(email, code);
    if (!valid) {
      return NextResponse.json(
        { error: "Código inválido o expirado" },
        { status: 401 }
      );
    }

    // Create JWT token
    const token = await createToken({
      email,
      createdAt: Date.now(),
    });

    const response = NextResponse.json({ success: true, token });

    // Set httpOnly cookie
    response.cookies.set("session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return NextResponse.json(
      { error: "Error al verificar código" },
      { status: 500 }
    );
  }
}
