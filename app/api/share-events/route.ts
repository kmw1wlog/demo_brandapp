import { saveShareEvent } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const result = await saveShareEvent({
      ...payload,
      created_at: new Date().toISOString()
    });
    return Response.json(result);
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : "share event save failed" },
      { status: 500 }
    );
  }
}
