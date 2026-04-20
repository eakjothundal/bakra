const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

export const EVENT_TYPES = [
  'visit',
  'click_play',
  'click_download',
  'click_leaderboard',
  'character_selected',
  'game_started',
  'game_ended',
  'name_provided',
] as const;

export type EventType = (typeof EVENT_TYPES)[number];

export interface ValidEvent {
  visitorId: string;
  sessionId: string;
  eventType: EventType;
  eventData: Record<string, unknown>;
  client: Record<string, unknown>;
}

export type ValidateResult =
  | { ok: true; value: ValidEvent }
  | { ok: false; error: string };

const MAX_EVENT_DATA_BYTES = 2048;
const MAX_CLIENT_BYTES = 4096;

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

export function validateEvent(raw: unknown): ValidateResult {
  if (!isPlainObject(raw)) return { ok: false, error: 'body must be an object' };

  if (typeof raw.visitorId !== 'string' || !UUID_V4.test(raw.visitorId)) {
    return { ok: false, error: 'invalid visitorId' };
  }
  if (typeof raw.sessionId !== 'string' || !UUID_V4.test(raw.sessionId)) {
    return { ok: false, error: 'invalid sessionId' };
  }
  if (
    typeof raw.eventType !== 'string' ||
    !(EVENT_TYPES as readonly string[]).includes(raw.eventType)
  ) {
    return { ok: false, error: 'invalid eventType' };
  }

  let eventData: Record<string, unknown> = {};
  if (raw.eventData !== undefined) {
    if (!isPlainObject(raw.eventData)) {
      return { ok: false, error: 'eventData must be an object' };
    }
    if (JSON.stringify(raw.eventData).length > MAX_EVENT_DATA_BYTES) {
      return { ok: false, error: 'eventData too large' };
    }
    eventData = raw.eventData;
  }

  let client: Record<string, unknown> = {};
  if (raw.client !== undefined) {
    if (!isPlainObject(raw.client)) {
      return { ok: false, error: 'client must be an object' };
    }
    if (JSON.stringify(raw.client).length > MAX_CLIENT_BYTES) {
      return { ok: false, error: 'client too large' };
    }
    client = raw.client;
  }

  return {
    ok: true,
    value: {
      visitorId: raw.visitorId,
      sessionId: raw.sessionId,
      eventType: raw.eventType as EventType,
      eventData,
      client,
    },
  };
}

export function parseNetlifyGeo(header: string | null): Record<string, unknown> {
  if (!header) return {};
  try {
    const json = Buffer.from(header, 'base64').toString('utf8');
    const parsed = JSON.parse(json) as Record<string, unknown>;
    const country = isPlainObject(parsed.country)
      ? (parsed.country as Record<string, unknown>)
      : {};
    const subdivision = isPlainObject(parsed.subdivision)
      ? (parsed.subdivision as Record<string, unknown>)
      : {};
    return {
      country: typeof country.code === 'string' ? country.code : undefined,
      countryName: typeof country.name === 'string' ? country.name : undefined,
      city: typeof parsed.city === 'string' ? parsed.city : undefined,
      subdivision:
        typeof subdivision.name === 'string' ? subdivision.name : undefined,
      timezone: typeof parsed.timezone === 'string' ? parsed.timezone : undefined,
      latitude:
        typeof parsed.latitude === 'number' ? parsed.latitude : undefined,
      longitude:
        typeof parsed.longitude === 'number' ? parsed.longitude : undefined,
    };
  } catch {
    return {};
  }
}

export function extractIp(headers: Headers): string | undefined {
  const direct = headers.get('x-nf-client-connection-ip');
  if (direct) return direct;
  const fwd = headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0]?.trim();
  return undefined;
}
