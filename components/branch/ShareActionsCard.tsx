"use client";

import { Check, Copy, Share2 } from "lucide-react";
import { useState } from "react";
import { getAnalyticsSnapshot } from "@/lib/analytics/client";
import { trackEvent } from "@/lib/branch/events";

type ShareActionsCardProps = {
  title: string;
  description: string;
  shareTitle: string;
  shareBody: string;
  pagePath?: string;
  testId?: string;
  category?: string;
  brandName?: string;
  highlight?: boolean;
};

export function ShareActionsCard({ title, description, shareTitle, shareBody, pagePath, testId, category, brandName, highlight = false }: ShareActionsCardProps) {
  const [linkCopied, setLinkCopied] = useState(false);
  const [summaryCopied, setSummaryCopied] = useState(false);
  const [saveSource, setSaveSource] = useState<"supabase" | "mock" | "idle">("idle");

  async function persistShareEvent(eventName: "share_cta_clicked" | "share_completed", shareType: "link" | "summary") {
    const analytics = getAnalyticsSnapshot();
    try {
      const response = await fetch("/api/share-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: analytics.session?.sessionId ?? "",
          distinct_id: analytics.profile?.distinctId ?? "",
          analytics_env: analytics.profile?.env ?? "",
          mixpanel_token: analytics.profile?.token ?? "",
          event_name: eventName,
          share_type: shareType,
          page_path: pagePath ?? (typeof window === "undefined" ? "" : window.location.pathname),
          category: category ?? "",
          brand_name: brandName ?? "",
          share_title: shareTitle
        })
      });
      const result = await response.json();
      setSaveSource((current) => (current === "supabase" || result.source === "supabase" ? "supabase" : "mock"));
    } catch {
      setSaveSource((current) => (current === "supabase" ? "supabase" : "mock"));
    }
  }

  async function copyLink() {
    const url = typeof window === "undefined" ? pagePath ?? "" : `${window.location.origin}${pagePath ?? window.location.pathname}`;
    trackEvent("share_cta_clicked", { share_type: "link", page_path: pagePath });
    await persistShareEvent("share_cta_clicked", "link");
    await navigator.clipboard.writeText(url);
    setLinkCopied(true);
    trackEvent("share_completed", { share_type: "link", page_path: pagePath });
    await persistShareEvent("share_completed", "link");
  }

  async function copySummary() {
    const url = typeof window === "undefined" ? pagePath ?? "" : `${window.location.origin}${pagePath ?? window.location.pathname}`;
    const summary = `${shareTitle}\n\n${shareBody}\n\n체험 링크: ${url}`;
    trackEvent("share_cta_clicked", { share_type: "summary", page_path: pagePath });
    await persistShareEvent("share_cta_clicked", "summary");
    await navigator.clipboard.writeText(summary);
    setSummaryCopied(true);
    trackEvent("share_completed", { share_type: "summary", page_path: pagePath });
    await persistShareEvent("share_completed", "summary");
  }

  return (
    <section data-testid={testId} className={`rounded-[28px] border p-6 shadow-[0_18px_50px_rgba(61,45,27,0.06)] ${highlight ? "border-[#cfe8d8] bg-gradient-to-br from-[#f4fbf7] to-white" : "border-[#e4dacb] bg-white"}`}>
      <div className="flex items-start gap-3">
        <span className="mt-1 rounded-2xl bg-[#eef8f3] p-3 text-[#0f7b54]">
          <Share2 size={20} />
        </span>
        <div>
          {highlight ? <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0f7b54]">공유하고 의견 받기</p> : null}
          <h3 className="text-2xl font-black text-[#211f1a]">{title}</h3>
          <p className="mt-2 text-sm font-bold leading-6 text-[#6a6258]">{description}</p>
        </div>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <button type="button" onClick={copyLink} className="rounded-2xl border border-[#d7e7df] bg-[#f4fbf7] px-5 py-4 text-left text-sm font-black text-[#0f7b54]">
          <span className="flex items-center gap-2">
            {linkCopied ? <Check size={18} /> : <Copy size={18} />}
            공유 링크 복사
          </span>
          <span className="mt-2 block text-xs font-bold text-[#4b6a5d]">{linkCopied ? "링크 복사 완료" : "가족/동업자와 지금 보고 있는 결과를 바로 공유합니다."}</span>
        </button>
        <button type="button" onClick={copySummary} className="rounded-2xl border border-[#eadfce] bg-[#fffaf3] px-5 py-4 text-left text-sm font-black text-[#4a2a18]">
          <span className="flex items-center gap-2">
            {summaryCopied ? <Check size={18} /> : <Copy size={18} />}
            동업자용 요약 복사
          </span>
          <span className="mt-2 block text-xs font-bold text-[#7b6a59]">{summaryCopied ? "요약 복사 완료" : "업종, 브랜드, 준비 방향을 한 번에 전달하는 텍스트를 복사합니다."}</span>
        </button>
      </div>
      {saveSource !== "idle" ? <p className="mt-3 text-xs font-black text-[#5f6b63]">공유 이벤트 저장 경로: {saveSource === "supabase" ? "Supabase" : "Mock fallback"}</p> : null}
    </section>
  );
}
