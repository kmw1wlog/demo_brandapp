import { expect, test } from "playwright/test";

const baseURL = process.env.BASE_URL ?? "http://localhost:3003";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/rest\/v1\/?$/, "") ?? "";
const supabaseSecret = process.env.SUPABASE_SECRET_KEY ?? "";

test("beta metrics page exports session data and saves the session row into Supabase", async ({ page, request }) => {
  test.skip(!supabaseUrl || !supabaseSecret, "supabase env required");

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

  const sessionId = await page.evaluate(() => {
    const session = JSON.parse(window.localStorage.getItem("branch_analytics_session_v1") ?? "null");
    return session?.sessionId ?? "";
  });
  expect(sessionId).not.toBe("");

  const [csvDownload] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "CSV row export" }).click()
  ]);
  expect(csvDownload.suggestedFilename()).toBe("branch-session-export.csv");

  await page.getByRole("button", { name: "Supabase 저장" }).click();
  await expect(page.getByText("Supabase 저장 완료")).toBeVisible();

  const response = await request.get(
    `${supabaseUrl}/rest/v1/branch_user_inputs?select=id,session_id,payload&session_id=eq.${sessionId}&order=created_at.desc&limit=1`,
    {
      headers: {
        apikey: supabaseSecret,
        Authorization: `Bearer ${supabaseSecret}`
      }
    }
  );
  expect(response.ok()).toBeTruthy();
  const rows = await response.json();
  expect(rows.length).toBeGreaterThan(0);
  expect(rows[0].payload?.kind).toBe("analytics_session_export");
});
