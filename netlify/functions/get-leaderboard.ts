import { ScanCommand } from '@aws-sdk/lib-dynamodb';
import { getDoc, getTableName, json } from './_shared';
import type { LeaderboardEntry } from '../../src/types';

export default async function handler(): Promise<Response> {
  try {
    const doc = getDoc();
    const resp = await doc.send(
      new ScanCommand({
        TableName: getTableName(),
        Limit: 100,
        ProjectionExpression: 'playerId, #n, #c, score, updatedAt',
        ExpressionAttributeNames: { '#n': 'name', '#c': 'character' },
      }),
    );

    const rows = (resp.Items ?? []) as LeaderboardEntry[];
    rows.sort((a, b) => (b.score - a.score) || (a.updatedAt - b.updatedAt));

    return new Response(JSON.stringify({ entries: rows }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=10, s-maxage=10',
      },
    });
  } catch (err) {
    console.error('get-leaderboard failed', err);
    return json(500, { error: 'failed to fetch leaderboard' });
  }
}

export const config = { path: '/.netlify/functions/get-leaderboard' };
