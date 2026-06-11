import { expect, test } from "playwright/test";

const baseURL = process.env.BASE_URL ?? "http://localhost:3003";

test("analytics bootstrap creates a staging session and logs core funnel screens", async ({ page }) => {
  await page.goto(`${baseURL}/onboarding`, { waitUntil: "networkidle" });
  await page.goto(`${baseURL}/dashboard/startup/input`, { waitUntil: "networkidle" });
  await page.getByRole("link", { name: "내 브랜드 창업안 생성하기 약 30초 소요" }).click();
  await expect(page).toHaveURL(/\/dashboard\/startup\/brand/);

  await page.goto(`${baseURL}/dashboard/startup/new`, { waitUntil: "networkidle" });
  await page.goto(`${baseURL}/dashboard/startup/timetable`, { waitUntil: "networkidle" });
  await page.goto(`${baseURL}/dashboard/startup/franchise`, { waitUntil: "networkidle" });
  await page.goto(`${baseURL}/dashboard/startup/owner-preview`, { waitUntil: "networkidle" });

  const snapshot = await page.evaluate(() => ({
    profile: JSON.parse(window.localStorage.getItem("branch_analytics_profile_v1") ?? "null"),
    session: JSON.parse(window.localStorage.getItem("branch_analytics_session_v1") ?? "null"),
    debug: JSON.parse(window.localStorage.getItem("branch_mixpanel_debug_v1") ?? "null"),
    events: JSON.parse(window.localStorage.getItem("branch_analytics_event_log_v1") ?? "[]")
  }));

  expect(snapshot.profile?.env).toBe("staging");
  expect(snapshot.profile?.token).toBe("b2ddaf5ca7c7e6680437daed57488f6e");
  expect(snapshot.session?.pageViews).toBeGreaterThanOrEqual(6);
  expect(snapshot.session?.eventCount).toBeGreaterThanOrEqual(6);
  expect(snapshot.debug?.mixpanelEnabled).toBeTruthy();
  expect(snapshot.events.some((event: { eventName: string }) => event.eventName === "landing_viewed")).toBeTruthy();
  expect(snapshot.events.some((event: { eventName: string }) => event.eventName === "startup_plan_generated")).toBeTruthy();
  expect(snapshot.events.some((event: { eventName: string }) => event.eventName === "owner_dashboard_preview_viewed")).toBeTruthy();
});
