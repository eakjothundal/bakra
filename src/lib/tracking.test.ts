import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

async function importFresh() {
  vi.resetModules();
  return await import('./tracking');
}

const ENDPOINT = '/.netlify/functions/track-event';

describe('tracking', () => {
  let beaconSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    beaconSpy = vi.fn().mockReturnValue(true);
    (navigator as unknown as { sendBeacon: typeof beaconSpy }).sendBeacon =
      beaconSpy;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete (navigator as unknown as { sendBeacon?: unknown }).sendBeacon;
  });

  it('fires a visit event once per session', async () => {
    const { trackEvent } = await importFresh();
    trackEvent('visit');
    trackEvent('visit');
    expect(beaconSpy).toHaveBeenCalledTimes(1);
    expect(beaconSpy.mock.calls[0][0]).toBe(ENDPOINT);
  });

  it('sends non-visit events every time', async () => {
    const { trackEvent } = await importFresh();
    trackEvent('click_play');
    trackEvent('click_play');
    expect(beaconSpy).toHaveBeenCalledTimes(2);
  });

  it('includes visitorId, sessionId, eventType, eventData', async () => {
    const { trackEvent } = await importFresh();
    trackEvent('game_ended', { score: 42, character: 'eakjot' });
    expect(beaconSpy).toHaveBeenCalledTimes(1);
    const blob = beaconSpy.mock.calls[0][1] as Blob;
    const text = await blob.text();
    const body = JSON.parse(text);
    expect(body.eventType).toBe('game_ended');
    expect(body.eventData).toEqual({ score: 42, character: 'eakjot' });
    expect(typeof body.visitorId).toBe('string');
    expect(typeof body.sessionId).toBe('string');
    expect(body.client).toBeDefined();
  });

  it('sets visit dedupe flag and session id in sessionStorage', async () => {
    const { trackEvent } = await importFresh();
    trackEvent('visit');
    expect(sessionStorage.getItem('bakra:visitTracked')).toBe('1');
    expect(sessionStorage.getItem('bakra:sessionId')).toMatch(
      /^[0-9a-f-]{36}$/,
    );
  });

  it('reuses sessionId across events in the same session', async () => {
    const { trackEvent } = await importFresh();
    trackEvent('click_play');
    trackEvent('click_download');
    const body1 = JSON.parse(
      await (beaconSpy.mock.calls[0][1] as Blob).text(),
    );
    const body2 = JSON.parse(
      await (beaconSpy.mock.calls[1][1] as Blob).text(),
    );
    expect(body1.sessionId).toBe(body2.sessionId);
  });

  it('never throws even if sendBeacon throws', async () => {
    beaconSpy.mockImplementation(() => {
      throw new Error('boom');
    });
    const { trackEvent } = await importFresh();
    expect(() => trackEvent('visit')).not.toThrow();
  });
});
