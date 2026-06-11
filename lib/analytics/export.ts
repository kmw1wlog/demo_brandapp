type ExportPayload = {
  analytics: {
    profile: {
      env: string;
      token: string;
      distinctId: string;
      firstSeenAt: string;
      lastSeenAt: string;
      lastPagePath: string;
    } | null;
    session: {
      sessionId: string;
      startedAt: string;
      lastSeenAt: string;
      entryPath: string;
      lastPagePath: string;
      pageViews: number;
      eventCount: number;
    } | null;
    events: { eventName: string }[];
  };
  events: { event_name: string }[];
  consultationLeads: { category: string }[];
  feedback: unknown[];
  betaSignups: { purpose: string }[];
  selectedBrand: string;
  ownerPreview: boolean;
};

export type SessionExportRow = {
  exported_at: string;
  analytics_env: string;
  mixpanel_token: string;
  distinct_id: string;
  session_id: string;
  session_started_at: string;
  session_last_seen_at: string;
  entry_path: string;
  last_page_path: string;
  page_views: number;
  analytics_event_count: number;
  branch_event_count: number;
  consultation_lead_count: number;
  feedback_count: number;
  beta_signup_count: number;
  selected_brand_id: string;
  owner_preview_interest: boolean;
  analytics_event_names: string;
  branch_event_names: string;
  beta_signup_purposes: string;
  lead_categories: string;
};

function uniqueJoin(values: string[]) {
  return [...new Set(values.filter(Boolean))].join(" | ");
}

export function buildSessionExportRow(data: ExportPayload): SessionExportRow {
  return {
    exported_at: new Date().toISOString(),
    analytics_env: data.analytics.profile?.env ?? "unknown",
    mixpanel_token: data.analytics.profile?.token ?? "",
    distinct_id: data.analytics.profile?.distinctId ?? "",
    session_id: data.analytics.session?.sessionId ?? "",
    session_started_at: data.analytics.session?.startedAt ?? "",
    session_last_seen_at: data.analytics.session?.lastSeenAt ?? "",
    entry_path: data.analytics.session?.entryPath ?? "",
    last_page_path: data.analytics.session?.lastPagePath ?? "",
    page_views: data.analytics.session?.pageViews ?? 0,
    analytics_event_count: data.analytics.session?.eventCount ?? data.analytics.events.length,
    branch_event_count: data.events.length,
    consultation_lead_count: data.consultationLeads.length,
    feedback_count: data.feedback.length,
    beta_signup_count: data.betaSignups.length,
    selected_brand_id: data.selectedBrand,
    owner_preview_interest: data.ownerPreview,
    analytics_event_names: uniqueJoin(data.analytics.events.map((event) => event.eventName)),
    branch_event_names: uniqueJoin(data.events.map((event) => event.event_name)),
    beta_signup_purposes: uniqueJoin(data.betaSignups.map((signup) => signup.purpose)),
    lead_categories: uniqueJoin(data.consultationLeads.map((lead) => lead.category))
  };
}

function escapeCsv(value: string | number | boolean) {
  const text = String(value ?? "");
  return `"${text.replaceAll(`"`, `""`)}"`;
}

export function exportRowsToCsv(rows: SessionExportRow[]) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]) as Array<keyof SessionExportRow>;
  const lines = [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => escapeCsv(row[header])).join(","))
  ];
  return lines.join("\n");
}
