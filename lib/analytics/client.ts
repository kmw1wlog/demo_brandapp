"use client";

type AnalyticsEnv = "prod" | "staging";

type AnalyticsProfile = {
  distinctId: string;
  env: AnalyticsEnv;
  token: string;
  firstSeenAt: string;
  lastSeenAt: string;
  lastPagePath: string;
};

type AnalyticsSession = {
  sessionId: string;
  env: AnalyticsEnv;
  startedAt: string;
  lastSeenAt: string;
  entryPath: string;
  lastPagePath: string;
  pageViews: number;
  eventCount: number;
};

type AnalyticsEventLog = {
  eventName: string;
  timestamp: string;
  pagePath: string;
  properties: Record<string, unknown>;
};

type AnalyticsDebugState = {
  env: AnalyticsEnv;
  token: string;
  distinctId: string;
  sessionId: string;
  mixpanelEnabled: boolean;
  totalEvents: number;
  lastEventName?: string;
  lastEventAt?: string;
  lastPagePath?: string;
};

const STAGING_TOKEN = "b2ddaf5ca7c7e6680437daed57488f6e";
const PROD_TOKEN = "6b848093fbc3d46ec2d0a18a8b41f696";
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

export const analyticsKeys = {
  profile: "branch_analytics_profile_v1",
  session: "branch_analytics_session_v1",
  debug: "branch_mixpanel_debug_v1",
  eventLog: "branch_analytics_event_log_v1"
} as const;

declare global {
  interface Window {
    __branchMixpanelInitialized?: boolean;
  }
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function getNowIso() {
  return new Date().toISOString();
}

function getPagePath() {
  if (typeof window === "undefined") return "/";
  return window.location.pathname + window.location.search;
}

function notifyAnalyticsUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("branch-analytics-updated"));
}

export function resolveAnalyticsEnv(hostname?: string): AnalyticsEnv {
  const rawEnv = process.env.NEXT_PUBLIC_APP_ENV?.toLowerCase();
  if (rawEnv === "prod" || rawEnv === "production") return "prod";
  if (rawEnv === "staging") return "staging";

  const currentHost = hostname ?? (typeof window === "undefined" ? "" : window.location.hostname);
  const stagingMarkers = ["localhost", "127.0.0.1", "staging", "demo-brandapp", "demo_brandapp", "vercel.app"];
  return stagingMarkers.some((marker) => currentHost.includes(marker)) ? "staging" : "prod";
}

export function resolveMixpanelToken(env: AnalyticsEnv) {
  const envToken = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;
  if (envToken) return envToken;
  return env === "prod" ? PROD_TOKEN : STAGING_TOKEN;
}

function getStoredProfile() {
  return readJson<AnalyticsProfile | null>(analyticsKeys.profile, null);
}

function getStoredSession() {
  return readJson<AnalyticsSession | null>(analyticsKeys.session, null);
}

function setDebugState(state: AnalyticsDebugState) {
  writeJson(analyticsKeys.debug, state);
}

function appendEventLog(entry: AnalyticsEventLog) {
  const current = readJson<AnalyticsEventLog[]>(analyticsKeys.eventLog, []);
  writeJson(analyticsKeys.eventLog, [...current, entry].slice(-200));
}

function isExpired(session: AnalyticsSession) {
  return Date.now() - new Date(session.lastSeenAt).getTime() > SESSION_TIMEOUT_MS;
}

export function ensureAnalyticsSession() {
  const now = getNowIso();
  const env = resolveAnalyticsEnv();
  const token = resolveMixpanelToken(env);
  const pagePath = getPagePath();

  const profile = getStoredProfile();
  const nextProfile: AnalyticsProfile = profile
    ? {
        ...profile,
        env,
        token,
        lastSeenAt: now,
        lastPagePath: pagePath
      }
    : {
        distinctId: crypto.randomUUID(),
        env,
        token,
        firstSeenAt: now,
        lastSeenAt: now,
        lastPagePath: pagePath
      };

  const session = getStoredSession();
  const nextSession: AnalyticsSession =
    session && session.env === env && !isExpired(session)
      ? {
          ...session,
          lastSeenAt: now,
          lastPagePath: pagePath
        }
      : {
          sessionId: crypto.randomUUID(),
          env,
          startedAt: now,
          lastSeenAt: now,
          entryPath: pagePath,
          lastPagePath: pagePath,
          pageViews: 0,
          eventCount: 0
        };

  writeJson(analyticsKeys.profile, nextProfile);
  writeJson(analyticsKeys.session, nextSession);
  setDebugState({
    env,
    token,
    distinctId: nextProfile.distinctId,
    sessionId: nextSession.sessionId,
    mixpanelEnabled: true,
    totalEvents: nextSession.eventCount,
    lastPagePath: nextSession.lastPagePath
  });
  notifyAnalyticsUpdated();
  return { profile: nextProfile, session: nextSession };
}

async function initializeMixpanel(profile: AnalyticsProfile) {
  if (typeof window === "undefined") return;
  if (window.__branchMixpanelInitialized) return;

  const mixpanel = (await import("mixpanel-browser")).default;
  mixpanel.init(profile.token, {
    persistence: "localStorage",
    batch_requests: false,
    track_pageview: false,
    debug: profile.env !== "prod",
    ignore_dnt: true
  });
  mixpanel.identify(profile.distinctId);
  mixpanel.register({
    app_env: profile.env,
    app_name: "branch-demo"
  });
  window.__branchMixpanelInitialized = true;
}

export function initializeAnalytics() {
  if (typeof window === "undefined") return;
  const { profile } = ensureAnalyticsSession();
  void initializeMixpanel(profile);
}

function updateSession(mutator: (session: AnalyticsSession) => AnalyticsSession) {
  const current = getStoredSession();
  if (!current) return ensureAnalyticsSession().session;
  const next = mutator(current);
  writeJson(analyticsKeys.session, next);
  return next;
}

export function recordAnalyticsEvent(eventName: string, properties: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;

  const { profile } = ensureAnalyticsSession();
  const pagePath = getPagePath();
  const timestamp = getNowIso();
  const session = updateSession((current) => ({
    ...current,
    eventCount: current.eventCount + 1,
    lastSeenAt: timestamp,
    lastPagePath: pagePath
  }));

  appendEventLog({ eventName, timestamp, pagePath, properties });
  setDebugState({
    env: profile.env,
    token: profile.token,
    distinctId: profile.distinctId,
    sessionId: session.sessionId,
    mixpanelEnabled: true,
    totalEvents: session.eventCount,
    lastEventName: eventName,
    lastEventAt: timestamp,
    lastPagePath: pagePath
  });
  notifyAnalyticsUpdated();

  void initializeMixpanel(profile).then(async () => {
    const mixpanel = (await import("mixpanel-browser")).default;
    mixpanel.track(eventName, {
      ...properties,
      app_env: profile.env,
      page_path: pagePath,
      session_id: session.sessionId
    });
  });
}

export function trackScreenView(eventName: string, properties: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;

  updateSession((current) => ({
    ...current,
    pageViews: current.pageViews + 1
  }));
  recordAnalyticsEvent(eventName, { ...properties, screen_view: true });
}

export function getAnalyticsSnapshot() {
  return {
    profile: getStoredProfile(),
    session: getStoredSession(),
    debug: readJson<AnalyticsDebugState | null>(analyticsKeys.debug, null),
    events: readJson<AnalyticsEventLog[]>(analyticsKeys.eventLog, [])
  };
}
