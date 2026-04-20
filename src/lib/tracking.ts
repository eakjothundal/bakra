import { v4 as uuidv4 } from 'uuid';
import { getOrCreatePlayerId } from './identity';

export type EventType =
  | 'visit'
  | 'click_play'
  | 'click_download'
  | 'click_leaderboard'
  | 'character_selected'
  | 'game_started'
  | 'game_ended'
  | 'name_provided';

const ENDPOINT = '/.netlify/functions/track-event';
const SESSION_KEY = 'bakra:sessionId';
const VISIT_FLAG_KEY = 'bakra:visitTracked';

function safeSessionGet(key: string): string | null {
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSessionSet(key: string, value: string): void {
  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

export function getOrCreateSessionId(): string {
  const existing = safeSessionGet(SESSION_KEY);
  if (existing) return existing;
  const id = uuidv4();
  safeSessionSet(SESSION_KEY, id);
  return id;
}

function tryGet<T>(fn: () => T): T | undefined {
  try {
    return fn();
  } catch {
    return undefined;
  }
}

export function buildClientPayload(): Record<string, unknown> {
  const nav = typeof navigator !== 'undefined' ? navigator : undefined;
  const win = typeof window !== 'undefined' ? window : undefined;
  const doc = typeof document !== 'undefined' ? document : undefined;

  const queryParams: Record<string, string> = {};
  tryGet(() => {
    if (!win) return;
    const sp = new URLSearchParams(win.location.search);
    for (const key of ['ref', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']) {
      const val = sp.get(key);
      if (val) queryParams[key] = val;
    }
  });

  const screen = tryGet(() => {
    if (!win?.screen) return undefined;
    return {
      w: win.screen.width,
      h: win.screen.height,
      dpr: win.devicePixelRatio ?? 1,
    };
  });

  const viewport = tryGet(() => {
    if (!win) return undefined;
    return { w: win.innerWidth, h: win.innerHeight };
  });

  const connection = tryGet(() => {
    const c = (nav as unknown as { connection?: Record<string, unknown> })
      ?.connection;
    if (!c) return undefined;
    return {
      effectiveType: typeof c.effectiveType === 'string' ? c.effectiveType : undefined,
      downlink: typeof c.downlink === 'number' ? c.downlink : undefined,
      saveData: typeof c.saveData === 'boolean' ? c.saveData : undefined,
    };
  });

  return {
    url: tryGet(() => win?.location.href),
    pathname: tryGet(() => win?.location.pathname),
    query: Object.keys(queryParams).length > 0 ? queryParams : undefined,
    docReferrer: tryGet(() => doc?.referrer || undefined),
    screen,
    viewport,
    locale: tryGet(() => nav?.language),
    languages: tryGet(() =>
      nav?.languages ? Array.from(nav.languages) : undefined,
    ),
    platform: tryGet(() => nav?.platform),
    cores: tryGet(() => nav?.hardwareConcurrency),
    deviceMemory: tryGet(
      () => (nav as unknown as { deviceMemory?: number })?.deviceMemory,
    ),
    colorScheme: tryGet(() =>
      win?.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
    ),
    reducedMotion: tryGet(
      () => win?.matchMedia('(prefers-reduced-motion: reduce)').matches,
    ),
    touch: tryGet(() => win && 'ontouchstart' in win),
    connection,
    tzOffsetMin: tryGet(() => new Date().getTimezoneOffset()),
    clientTime: Date.now(),
    clientTimezone: tryGet(
      () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    ),
  };
}

function send(body: Record<string, unknown>): void {
  const json = JSON.stringify(body);
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const blob = new Blob([json], { type: 'application/json' });
      if (navigator.sendBeacon(ENDPOINT, blob)) return;
    }
  } catch {
    // fall through
  }
  try {
    void fetch(ENDPOINT, {
      method: 'POST',
      body: json,
      keepalive: true,
      headers: { 'Content-Type': 'application/json' },
    }).catch(() => {
      // ignore
    });
  } catch {
    // ignore
  }
}

export function trackEvent(
  eventType: EventType,
  eventData?: Record<string, unknown>,
): void {
  try {
    if (typeof window === 'undefined') return;

    if (eventType === 'visit') {
      if (safeSessionGet(VISIT_FLAG_KEY) === '1') return;
      safeSessionSet(VISIT_FLAG_KEY, '1');
    }

    const visitorId = getOrCreatePlayerId();
    const sessionId = getOrCreateSessionId();

    send({
      visitorId,
      sessionId,
      eventType,
      eventData: eventData ?? {},
      client: buildClientPayload(),
    });
  } catch {
    // analytics must never break the app
  }
}
