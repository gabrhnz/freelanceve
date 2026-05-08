import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("session")?.value;

  if (!token) {
    return NextResponse.json({ user: null });
  }

  const session = await verifyToken(token);
  if (!session) {
    const response = NextResponse.json({ user: null });
    response.cookies.delete("session");
    return response;
  }

  return NextResponse.json({ user: session });
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete("session");
  return response;
}
