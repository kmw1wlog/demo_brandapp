import { saveAnalyticsSessionExport } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const result = await saveAnalyticsSessionExport({
      ...payload,
      created_at: new Date().toISOString()
    });
    return Response.json(result);
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : "session export failed" },
      { status: 500 }
    );
  }
}
