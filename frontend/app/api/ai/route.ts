import { NextRequest, NextResponse } from "next/server";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const MODEL = "meta-llama/llama-3.1-8b-instruct:free";

async function callLLM(systemPrompt: string, userPrompt: string): Promise<string> {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 1024,
      temperature: 0.3,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("OpenRouter error:", err);
    throw new Error("AI service unavailable");
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || "";
}

export async function POST(req: NextRequest) {
  if (!OPENROUTER_API_KEY) {
    return NextResponse.json({ error: "AI not configured" }, { status: 500 });
  }

  try {
    const { action, ...params } = await req.json();

    // ── ENHANCE: Improve service title + description ──
    if (action === "enhance") {
      const { titulo, descripcion, categoria } = params;
      const result = await callLLM(
        `You are a copywriting expert for a freelance marketplace. You improve service listings to be more professional, compelling, and clear. Output ONLY valid JSON with "titulo" and "descripcion" fields. The title should be max 80 chars, the description max 450 chars. Keep the same language as the input (Spanish or English). Do NOT add markdown, code blocks, or explanations.`,
        `Category: ${categoria}\nCurrent title: ${titulo || "(empty)"}\nCurrent description: ${descripcion || "(empty)"}\n\nImprove this service listing. Return JSON: {"titulo":"...","descripcion":"..."}`
      );

      // Parse JSON from response
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return NextResponse.json({
          titulo: (parsed.titulo || titulo).slice(0, 100),
          descripcion: (parsed.descripcion || descripcion).slice(0, 500),
        });
      }
      return NextResponse.json({ titulo, descripcion });
    }

    // ── SEARCH: Smart semantic search interpretation ──
    if (action === "search") {
      const { query, services } = params;
      // Given a natural language query and a list of services, return ranked IDs
      const serviceList = (services as any[])
        .slice(0, 20)
        .map((s: any) => `ID:${s.id} | ${s.titulo} | ${s.descripcion?.slice(0, 100)} | ${s.categoria} | $${s.precio_usdc}`)
        .join("\n");

      const result = await callLLM(
        `You are a search engine for a freelance marketplace. Given a user query, rank the services by relevance. Return ONLY a JSON array of service IDs sorted by relevance, most relevant first. If no services match, return an empty array. Do NOT add markdown or explanations.`,
        `User query: "${query}"\n\nAvailable services:\n${serviceList}\n\nReturn JSON array of IDs: ["id1","id2",...]`
      );

      const jsonMatch = result.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const ids = JSON.parse(jsonMatch[0]);
        return NextResponse.json({ rankedIds: ids });
      }
      return NextResponse.json({ rankedIds: [] });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err: any) {
    console.error("AI API error:", err);
    return NextResponse.json(
      { error: err.message || "AI service error" },
      { status: 500 }
    );
  }
}
