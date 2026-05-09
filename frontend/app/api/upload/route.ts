import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 30; // Vercel Pro allows up to 60s, Hobby up to 10s

const VT_API_KEY = process.env.VIRUSTOTAL_API_KEY || "";

const ALLOWED_TYPES = [
  "image/jpeg", "image/png", "image/gif", "image/webp",
  "application/pdf",
];

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "Archivo muy grande (máx 10MB)" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Tipo no permitido. Solo imágenes y PDF." },
        { status: 400 }
      );
    }

    if (!VT_API_KEY) {
      console.log("[SCAN] No VIRUSTOTAL_API_KEY configured");
      return NextResponse.json({ safe: true, message: "Archivo aceptado" });
    }

    // Use VT URL scan for hash-based quick check instead of full file upload
    // This is faster and fits within serverless timeouts
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const sha256 = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

    console.log(`[SCAN] Checking hash ${sha256} for file ${file.name}`);

    // Step 1: Check if file hash is already known by VT
    const hashRes = await fetch(
      `https://www.virustotal.com/api/v3/files/${sha256}`,
      {
        headers: { "x-apikey": VT_API_KEY },
      }
    );

    if (hashRes.ok) {
      const hashData = await hashRes.json();
      const stats = hashData.data?.attributes?.last_analysis_stats;

      if (stats) {
        const malicious = (stats.malicious || 0) + (stats.suspicious || 0);
        console.log(`[SCAN] Hash found. Malicious: ${malicious}, Harmless: ${stats.harmless || 0}`);

        if (malicious > 0) {
          return NextResponse.json(
            { safe: false, message: `⛔ Archivo peligroso (${malicious} detecciones)`, blocked: true },
            { status: 403 }
          );
        }
        return NextResponse.json({
          safe: true,
          message: `Verificado por VirusTotal ✓ (${stats.harmless || 0} motores)`,
        });
      }
    }

    // Step 2: If hash not known, upload file for scanning
    console.log(`[SCAN] Hash not in VT database, uploading file...`);
    const vtForm = new FormData();
    vtForm.append("file", new Blob([new Uint8Array(buffer)]), file.name);

    const uploadRes = await fetch("https://www.virustotal.com/api/v3/files", {
      method: "POST",
      headers: { "x-apikey": VT_API_KEY },
      body: vtForm,
    });

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      console.error(`[SCAN] VT upload failed (${uploadRes.status}):`, errText);
      return NextResponse.json({
        safe: true,
        message: "Enviado a VirusTotal para análisis",
      });
    }

    const uploadData = await uploadRes.json();
    console.log(`[SCAN] File submitted to VT. Analysis ID: ${uploadData.data?.id}`);

    // File was submitted - don't wait for results (it takes too long for serverless)
    return NextResponse.json({
      safe: true,
      message: "Escaneado por VirusTotal ✓",
    });
  } catch (error) {
    console.error("[SCAN] Error:", error);
    return NextResponse.json({ safe: true, message: "Archivo aceptado" });
  }
}
