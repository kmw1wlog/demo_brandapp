"use client";

import { Check, Copy, Share2 } from "lucide-react";
import { useState } from "react";
import { trackEvent } from "@/lib/branch/events";

type ShareActionsCardProps = {
  title: string;
  description: string;
  shareTitle: string;
  shareBody: string;
  pagePath?: string;
  testId?: string;
};

export function ShareActionsCard({ title, description, shareTitle, shareBody, pagePath, testId }: ShareActionsCardProps) {
  const [linkCopied, setLinkCopied] = useState(false);
  const [summaryCopied, setSummaryCopied] = useState(false);

  async function copyLink() {
    const url = typeof window === "undefined" ? pagePath ?? "" : `${window.location.origin}${pagePath ?? window.location.pathname}`;
    await navigator.clipboard.writeText(url);
    setLinkCopied(true);
    trackEvent("share_cta_clicked", { share_type: "link", page_path: pagePath });
    trackEvent("share_completed", { share_type: "link", page_path: pagePath });
  }

  async function copySummary() {
    const url = typeof window === "undefined" ? pagePath ?? "" : `${window.location.origin}${pagePath ?? window.location.pathname}`;
    const summary = `${shareTitle}\n\n${shareBody}\n\n체험 링크: ${url}`;
    await navigator.clipboard.writeText(summary);
    setSummaryCopied(true);
    trackEvent("share_cta_clicked", { share_type: "summary", page_path: pagePath });
    trackEvent("share_completed", { share_type: "summary", page_path: pagePath });
  }

  return (
    <section data-testid={testId} className="rounded-[28px] border border-[#e4dacb] bg-white p-6 shadow-[0_18px_50px_rgba(61,45,27,0.06)]">
      <div className="flex items-start gap-3">
        <span className="mt-1 rounded-2xl bg-[#eef8f3] p-3 text-[#0f7b54]">
          <Share2 size={20} />
        </span>
        <div>
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
    </section>
  );
}
