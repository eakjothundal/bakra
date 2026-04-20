import { createHash } from 'node:crypto';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { getDoc, getEventsTableName, json } from './_shared';
import {
  extractIp,
  parseNetlifyGeo,
  validateEvent,
} from './track-event-validate';

function stripUndefined<T extends Record<string, unknown>>(obj: T): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v;
  }
  return out as T;
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') return json(405, { error: 'method not allowed' });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json(400, { error: 'invalid JSON' });
  }

  const v = validateEvent(body);
  if (!v.ok) return json(400, { error: v.error });

  const { visitorId, sessionId, eventType, eventData, client } = v.value;

  const serverTime = Date.now();
  const ts = `${serverTime}-${Math.random().toString(36).slice(2, 8)}`;

  const ip = extractIp(req.headers);
  const ipHash = ip ? createHash('sha256').update(ip).digest('hex') : undefined;
  const geo = parseNetlifyGeo(req.headers.get('x-nf-geo'));

  const item = stripUndefined({
    visitorId,
    ts,
    serverTime,
    eventType,
    eventData,
    sessionId,
    ip,
    ipHash,
    ...geo,
    userAgent: req.headers.get('user-agent') ?? undefined,
    acceptLanguage: req.headers.get('accept-language') ?? undefined,
    referer: req.headers.get('referer') ?? undefined,
    ...client,
  });

  try {
    await getDoc().send(
      new PutCommand({
        TableName: getEventsTableName(),
        Item: item,
      }),
    );
    return new Response(null, { status: 204 });
  } catch (err) {
    console.error('track-event failed', err);
    return json(500, { error: 'failed to track event' });
  }
}

export const config = { path: '/.netlify/functions/track-event' };
