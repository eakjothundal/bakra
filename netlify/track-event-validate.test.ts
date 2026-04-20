import { describe, it, expect } from 'vitest';
import {
  extractIp,
  parseNetlifyGeo,
  validateEvent,
} from './functions/track-event-validate';

const ok = {
  visitorId: '550e8400-e29b-41d4-a716-446655440000',
  sessionId: '6ba7b810-9dad-41d1-80b4-00c04fd430c8',
  eventType: 'visit',
};

describe('validateEvent', () => {
  it('accepts minimal payload', () => {
    const r = validateEvent(ok);
    expect(r.ok).toBe(true);
  });

  it('rejects invalid visitorId UUID', () => {
    expect(validateEvent({ ...ok, visitorId: 'nope' }).ok).toBe(false);
  });

  it('rejects invalid sessionId UUID', () => {
    expect(validateEvent({ ...ok, sessionId: 'nope' }).ok).toBe(false);
  });

  it('rejects unknown eventType', () => {
    expect(validateEvent({ ...ok, eventType: 'hack' }).ok).toBe(false);
  });

  it('accepts known event types', () => {
    for (const t of [
      'visit',
      'click_play',
      'click_download',
      'click_leaderboard',
      'character_selected',
      'game_started',
      'game_ended',
      'name_provided',
    ]) {
      expect(validateEvent({ ...ok, eventType: t }).ok).toBe(true);
    }
  });

  it('rejects non-object eventData', () => {
    expect(validateEvent({ ...ok, eventData: 'x' }).ok).toBe(false);
    expect(validateEvent({ ...ok, eventData: [1, 2] }).ok).toBe(false);
  });

  it('rejects oversized eventData', () => {
    const big = { x: 'a'.repeat(5000) };
    expect(validateEvent({ ...ok, eventData: big }).ok).toBe(false);
  });

  it('preserves eventData and client', () => {
    const r = validateEvent({
      ...ok,
      eventData: { score: 12 },
      client: { url: 'https://ex.com' },
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.eventData).toEqual({ score: 12 });
      expect(r.value.client).toEqual({ url: 'https://ex.com' });
    }
  });

  it('rejects non-object body', () => {
    expect(validateEvent(null).ok).toBe(false);
    expect(validateEvent('x').ok).toBe(false);
  });
});

describe('extractIp', () => {
  it('prefers x-nf-client-connection-ip', () => {
    const h = new Headers({
      'x-nf-client-connection-ip': '1.2.3.4',
      'x-forwarded-for': '9.9.9.9',
    });
    expect(extractIp(h)).toBe('1.2.3.4');
  });

  it('falls back to first x-forwarded-for entry', () => {
    const h = new Headers({ 'x-forwarded-for': '1.2.3.4, 5.6.7.8' });
    expect(extractIp(h)).toBe('1.2.3.4');
  });

  it('returns undefined when no header present', () => {
    expect(extractIp(new Headers())).toBeUndefined();
  });
});

describe('parseNetlifyGeo', () => {
  it('parses base64 JSON geo', () => {
    const geo = {
      city: 'Lincoln',
      country: { code: 'US', name: 'United States' },
      subdivision: { code: 'CA', name: 'California' },
      timezone: 'America/Los_Angeles',
      latitude: 38.89,
      longitude: -121.29,
    };
    const b64 = Buffer.from(JSON.stringify(geo)).toString('base64');
    const parsed = parseNetlifyGeo(b64);
    expect(parsed.city).toBe('Lincoln');
    expect(parsed.country).toBe('US');
    expect(parsed.countryName).toBe('United States');
    expect(parsed.subdivision).toBe('California');
    expect(parsed.timezone).toBe('America/Los_Angeles');
    expect(parsed.latitude).toBe(38.89);
    expect(parsed.longitude).toBe(-121.29);
  });

  it('returns empty on missing header', () => {
    expect(parseNetlifyGeo(null)).toEqual({});
  });

  it('returns empty on malformed base64', () => {
    expect(parseNetlifyGeo('%%%not-base64%%%')).toEqual({});
  });
});
