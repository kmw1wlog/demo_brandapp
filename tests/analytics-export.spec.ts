import { expect, test } from "playwright/test";

const baseURL = process.env.BASE_URL ?? "http://localhost:3003";

test("beta metrics page exports session data as csv and shows save status", async ({ page }) => {
  await page.goto(`${baseURL}/onboarding`, { waitUntil: "networkidle" });
  await page.goto(`${baseURL}/dashboard/startup/new`, { waitUntil: "networkidle" });
  await page.goto(`${baseURL}/dashboard/startup/owner-preview`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "상담사 입점 시 연락받기" }).click();
  const waitlist = page.getByTestId("owner-waitlist");
  await waitlist.getByLabel("이메일").fill("metric-owner@example.com");
  await waitlist.getByRole("button", { name: "우선 연락 신청" }).click();
  await expect(waitlist.getByText("저장 완료")).toBeVisible();

  await page.goto(`${baseURL}/dashboard/startup/beta-metrics`, { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "믹스패널 세션 요약" })).toBeVisible();

  const [csvDownload] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "CSV row export" }).click()
  ]);
  expect(csvDownload.suggestedFilename()).toBe("branch-session-export.csv");

  await page.getByRole("button", { name: "Supabase 저장" }).click();
  await expect(page.getByText(/Supabase 저장 완료|환경변수 미설정: mock 저장으로 처리/)).toBeVisible();
});
