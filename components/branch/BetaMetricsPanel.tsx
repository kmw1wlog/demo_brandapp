"use client";

import { useEffect, useState } from "react";
import { buildSessionExportRow, exportRowsToCsv } from "@/lib/analytics/export";
import { exportBetaData } from "@/lib/branch/events";

export function BetaMetricsPanel() {
  const [data, setData] = useState<ReturnType<typeof exportBetaData> | null>(null);
  const [saveStatus, setSaveStatus] = useState<string>("");

  useEffect(() => {
    const refresh = () => setData(exportBetaData());
    refresh();
    window.addEventListener("branch-analytics-updated", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("branch-analytics-updated", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);
  if (!data) return null;

  const count = (name: string) => data.events.filter((event) => event.event_name === name).length;
  const analyticsCount = (name: string) => data.analytics.events.filter((event) => event.eventName === name).length;
  const categories = data.consultationLeads.reduce<Record<string, number>>((acc, lead) => {
    acc[lead.category] = (acc[lead.category] ?? 0) + 1;
    return acc;
  }, {});
  const sessionRow = buildSessionExportRow(data);

  function download() {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "branch-beta-data.json";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function downloadCsv() {
    const blob = new Blob([exportRowsToCsv([sessionRow])], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "branch-session-export.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function saveSessionRow() {
    setSaveStatus("저장 중...");
    const response = await fetch("/api/analytics/session-export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ row: sessionRow, raw_json: data })
    });
    const result = await response.json();
    if (result.ok) {
      setSaveStatus(result.source === "supabase" ? "Supabase 저장 완료" : "환경변수 미설정: mock 저장으로 처리");
      return;
    }
    setSaveStatus("세션 저장 실패");
  }

  return (
    <div className="grid gap-5">
      <div className="grid gap-3 md:grid-cols-4">
        <Metric label="분석 환경" value={sessionRow.analytics_env} />
        <Metric label="페이지뷰" value={sessionRow.page_views} />
        <Metric label="분석 이벤트" value={sessionRow.analytics_event_count} />
        <Metric label="세션 ID" value={sessionRow.session_id.slice(0, 8) || "-"} />
        <Metric label="총 이벤트" value={data.events.length} />
        <Metric label="브랜드 클릭" value={count("own_brand_detail_click")} />
        <Metric label="프랜차이즈 클릭" value={count("franchise_detail_click")} />
        <Metric label="상담 CTA" value={count("consultation_cta_click")} />
        <Metric label="상담 신청 완료" value={count("consultation_waitlist_submit")} />
        <Metric label="공동구매 예약" value={count("groupbuy_reservation_click")} />
        <Metric label="피드백 제출" value={count("feedback_submit")} />
        <Metric label="리포트 저장" value={count("report_save_click")} />
      </div>
      <section className="rounded-lg border border-[#ddd2c0] bg-white p-5">
        <h3 className="text-xl font-black text-[#164033]">믹스패널 세션 요약</h3>
        <div className="mt-4 grid gap-2 text-sm font-bold text-[#655d52]">
          <p>screen viewed: {analyticsCount("landing_viewed")} landing / {analyticsCount("startup_plan_generated")} plan / {analyticsCount("owner_dashboard_preview_viewed")} owner</p>
          <p>entry: {sessionRow.entry_path || "-"}</p>
          <p>last: {sessionRow.last_page_path || "-"}</p>
          <p>signups: {sessionRow.beta_signup_purposes || "없음"}</p>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <button onClick={download} className="rounded-lg bg-[#164033] px-4 py-3 text-sm font-black text-white">JSON export</button>
          <button onClick={downloadCsv} className="rounded-lg border border-[#164033] px-4 py-3 text-sm font-black text-[#164033]">CSV row export</button>
          <button onClick={saveSessionRow} className="rounded-lg border border-[#0f7b54] px-4 py-3 text-sm font-black text-[#0f7b54]">Supabase 저장</button>
        </div>
        <p className="mt-3 text-sm font-bold text-[#655d52]">{saveStatus || "로컬 다운로드는 항상 가능하고, 서버 환경변수가 있으면 같은 row를 Supabase에 적재합니다."}</p>
      </section>
      <section className="rounded-lg border border-[#ddd2c0] bg-white p-5">
        <h3 className="text-xl font-black text-[#164033]">연락처 남긴 리드</h3>
        <div className="mt-3 grid gap-2 text-sm">{data.consultationLeads.map((lead) => <p key={lead.id}>{lead.name} · {lead.contact} · {lead.category}</p>)}</div>
        <p className="mt-4 text-sm font-bold text-[#655d52]">상담 카테고리별: {Object.entries(categories).map(([key, value]) => `${key} ${value}`).join(", ") || "없음"}</p>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return <div className="rounded-lg border border-[#ddd2c0] bg-white p-4"><p className="text-xs font-bold text-[#655d52]">{label}</p><p className="mt-1 text-2xl font-black text-[#164033]">{value}</p></div>;
}
