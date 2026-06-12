"use client";

import { useEffect } from "react";
import { BrandConceptPreview, BusinessBlueprintCard, InputConditionSummary, StartupPlanHero, useDemoExperience } from "@/components/branch/DemoExperience";
import { InlineWaitlistCta } from "@/components/branch/InlineWaitlistCta";
import { ShareActionsCard } from "@/components/branch/ShareActionsCard";
import { trackScreenView } from "@/lib/analytics/client";
import Link from "next/link";

export default function StartupNewPage() {
  const { input, simulation } = useDemoExperience();

  useEffect(() => {
    trackScreenView("startup_plan_generated", {
      category: simulation.category.display_name,
      brand_name: simulation.virtualBrand.name,
      region: input.region
    });
  }, []);

  return (
    <div className="grid gap-8">
      <StartupPlanHero />
      <section className="grid gap-4">
        <div>
          <p className="text-sm font-black text-[#0f7b54]">완성 미리보기</p>
          <h2 className="mt-2 text-3xl font-black text-[#211f1a]">내 조건을 넣으면 이런 창업 청사진이 만들어집니다.</h2>
          <p className="mt-2 text-sm font-bold text-[#6a6258]">고기덮밥은 샘플 상태이며, 업종을 바꾸면 브랜드 이미지·메뉴·수익 시뮬레이션이 함께 바뀝니다.</p>
        </div>
        <ShareActionsCard
          title="이 창업안을 동업자·가족에게 바로 보내보세요"
          description="체험이 끝나기 전에 공유가 먼저 보여야 의견 회수율이 올라갑니다. 지금 보고 있는 청사진 링크와 요약을 바로 복사할 수 있습니다."
          shareTitle={`${simulation.category.display_name} 창업안 요약`}
          shareBody={`${simulation.category.display_name} 기준 브랜드 청사진과 수익 비교 체험 결과입니다. ${simulation.virtualBrand.name} 방향으로 검토 중이며, 다음 단계로 프랜차이즈 비교와 타임테이블을 확인하려고 합니다.`}
          pagePath="/dashboard/startup/new"
          testId="preview-share-cta"
          category={simulation.category.display_name}
          brandName={simulation.virtualBrand.name}
          highlight
        />
        <InputConditionSummary input={input} simulation={simulation} />
        <BrandConceptPreview simulation={simulation} compact />
        <BusinessBlueprintCard input={input} simulation={simulation} />
      </section>
      <InlineWaitlistCta
        title="이 결과 저장하고 나중에 이어보세요"
        description="브랜드 청사진, 업종 추천, 프랜차이즈 비교 결과가 더 보강되면 먼저 알려드립니다."
        purpose="startup_preview_save"
        submitLabel="저장하고 이어보기"
        benefits={["내 창업안 저장 링크", "업종별 비교 결과 업데이트", "상담 오픈 시 우선 알림"]}
        defaultBenefit="내 창업안 저장 링크"
        category={simulation.category.display_name}
        testId="preview-save-cta"
      />
      <section className="rounded-[28px] border border-[#eadfce] bg-white p-6 shadow-[0_18px_50px_rgba(61,45,27,0.06)]">
        <h2 className="text-2xl font-black text-[#211f1a]">기존 비교 기능도 보존되어 있습니다.</h2>
        <p className="mt-2 text-sm font-bold text-[#6a6258]">아래 상세 기능은 새 데모 플로우의 메뉴·공급처·프랜차이즈 비교 화면으로 재배치했습니다.</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/dashboard/startup/franchise" className="rounded-xl bg-[#073d2d] px-4 py-3 text-sm font-black text-white">브랜드 비교 보기</Link>
          <Link href="/dashboard/startup/finance" className="rounded-xl border border-[#e4dacb] px-4 py-3 text-sm font-black text-[#4a2a18]">4개월 회계 보기</Link>
          <Link href="/dashboard/startup/cost" className="rounded-xl border border-[#e4dacb] px-4 py-3 text-sm font-black text-[#4a2a18]">메뉴·원가 보기</Link>
        </div>
      </section>
    </div>
  );
}
