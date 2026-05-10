import { NextRequest, NextResponse } from "next/server";

const DEEPL_API_KEY = process.env.DEEPL_API_KEY;
const DEEPL_URL = "https://api-free.deepl.com/v2/translate";

export async function POST(req: NextRequest) {
  if (!DEEPL_API_KEY) {
    return NextResponse.json({ error: "Translation not configured" }, { status: 500 });
  }

  try {
    const { texts, targetLang } = await req.json();

    if (!texts || !Array.isArray(texts) || texts.length === 0 || !targetLang) {
      return NextResponse.json({ error: "Missing texts or targetLang" }, { status: 400 });
    }

    // DeepL accepts max 50 texts per request
    const batch = texts.slice(0, 50).map((t: string) => t || "");

    const params = new URLSearchParams();
    batch.forEach((t: string) => params.append("text", t));
    params.append("target_lang", targetLang.toUpperCase());

    const res = await fetch(DEEPL_URL, {
      method: "POST",
      headers: {
        Authorization: `DeepL-Auth-Key ${DEEPL_API_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("DeepL error:", res.status, err);
      return NextResponse.json({ error: "Translation service error" }, { status: 502 });
    }

    const data = await res.json();
    const translations = data.translations.map((t: any) => t.text);

    return NextResponse.json({ translations });
  } catch (err: any) {
    console.error("Translate API error:", err);
    return NextResponse.json({ error: err.message || "Translation error" }, { status: 500 });
  }
}
