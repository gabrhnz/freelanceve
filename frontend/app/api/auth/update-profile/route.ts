import { NextRequest, NextResponse } from "next/server";
import { verifyToken, createToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const token = req.cookies.get("session")?.value;

  if (!token) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const session = await verifyToken(token);
  if (!session) {
    return NextResponse.json({ error: "Sesión inválida" }, { status: 401 });
  }

  try {
    const { nombre, role, walletAddress } = await req.json();

    // Update session with new info
    const updatedSession = {
      ...session,
      ...(nombre && { nombre }),
      ...(role && { role }),
      ...(walletAddress && { walletAddress }),
    };

    const newToken = await createToken(updatedSession);

    const response = NextResponse.json({ success: true, user: updatedSession });
    response.cookies.set("session", newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Error al actualizar perfil" },
      { status: 500 }
    );
  }
}
