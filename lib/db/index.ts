import { insertIntoSupabase } from "./supabase";

export * from "./local";

function normalizeBudget(value: unknown) {
  if (value === undefined || value === null) return null;
  if (typeof value === "number" && Number.isFinite(value)) return Math.round(value);
  const digits = String(value).replace(/[^\d]/g, "");
  return digits ? Number(digits) : null;
}

export async function saveGroupBuyInterest(payload: unknown) {
  const inserted = await insertIntoSupabase("groupbuy_interests", payload);
  if (inserted.ok) return { ok: true, source: "supabase" };
  return { ok: true, source: "mock", warning: inserted.error };
}

export async function saveLead(payload: unknown) {
  const input = (payload ?? {}) as Record<string, unknown>;
  const inserted = await insertIntoSupabase("leads", {
    id: crypto.randomUUID(),
    name: String(input.name ?? ""),
    phone: String(input.phone ?? ""),
    category: String(input.category ?? ""),
    region: String(input.region ?? ""),
    budget: normalizeBudget(input.budget),
    notes: String(input.notes ?? ""),
    payload: input,
    created_at: input.created_at ?? new Date().toISOString()
  });
  if (inserted.ok) return { ok: true, source: "supabase" };
  return { ok: true, source: "mock", warning: inserted.error };
}

export async function saveAnalyticsSessionExport(payload: unknown) {
  const input = (payload ?? {}) as Record<string, unknown>;
  const row = (input.row ?? {}) as Record<string, unknown>;
  const rawJson = (input.raw_json ?? {}) as Record<string, unknown>;

  const inserted = await insertIntoSupabase("analytics_session_exports", {
    created_at: input.created_at ?? new Date().toISOString(),
    row,
    raw_json: rawJson
  });
  if (inserted.ok) return { ok: true, source: "supabase" };

  const fallback = await insertIntoSupabase("branch_user_inputs", {
    id: crypto.randomUUID(),
    session_id: String(row.session_id ?? crypto.randomUUID()),
    category: String((rawJson.category as string | undefined) ?? (row.selected_brand_id as string | undefined) ?? ""),
    region: String((rawJson.region as string | undefined) ?? ""),
    budget: normalizeBudget(rawJson.budget),
    payload: {
      kind: "analytics_session_export",
      row,
      raw_json: rawJson,
      fallback_reason: inserted.ok ? undefined : "analytics_session_exports_missing"
    },
    created_at: input.created_at ?? new Date().toISOString(),
    updated_at: new Date().toISOString()
  });

  if (fallback.ok) return { ok: true, source: "supabase" };
  return { ok: true, source: "mock", warning: `${inserted.ok ? "" : inserted.error} / ${fallback.error}` };
}

export async function saveFeedbackEntry(payload: unknown) {
  const input = (payload ?? {}) as Record<string, unknown>;
  const inserted = await insertIntoSupabase("branch_feedback_entries", {
    id: crypto.randomUUID(),
    stage: String(input.stage ?? ""),
    blocker: String(input.blocker ?? ""),
    feature: String(input.feature ?? ""),
    consultation: Boolean(input.consultation),
    contact: String(input.contact ?? ""),
    payload: input,
    created_at: input.created_at ?? new Date().toISOString()
  });

  if (inserted.ok) return { ok: true, source: "supabase" };
  return { ok: true, source: "mock", warning: inserted.error };
}

export async function saveShareEvent(payload: unknown) {
  const input = (payload ?? {}) as Record<string, unknown>;
  const createdAt = input.created_at ?? new Date().toISOString();
  const directInsert = await insertIntoSupabase("share_events", {
    id: crypto.randomUUID(),
    session_id: String(input.session_id ?? ""),
    event_name: String(input.event_name ?? ""),
    share_type: String(input.share_type ?? ""),
    page_path: String(input.page_path ?? ""),
    category: String(input.category ?? ""),
    brand_name: String(input.brand_name ?? ""),
    payload: input,
    created_at: createdAt
  });
  if (directInsert.ok) return { ok: true, source: "supabase" };

  const fallback = await insertIntoSupabase("branch_user_inputs", {
    id: crypto.randomUUID(),
    session_id: String(input.session_id ?? crypto.randomUUID()),
    category: String(input.category ?? ""),
    region: String(input.page_path ?? ""),
    budget: null,
    payload: {
      kind: "share_event",
      ...input,
      fallback_reason: "share_events_missing"
    },
    created_at: createdAt,
    updated_at: new Date().toISOString()
  });
  if (fallback.ok) return { ok: true, source: "supabase" };
  return { ok: true, source: "mock", warning: `${directInsert.error} / ${fallback.error}` };
}
