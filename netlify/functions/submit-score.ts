import { GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { ConditionalCheckFailedException } from '@aws-sdk/client-dynamodb';
import { getDoc, getTableName, json } from './_shared';
import { validateSubmit } from './submit-score.validate';

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') return json(405, { error: 'method not allowed' });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json(400, { error: 'invalid JSON' });
  }

  const v = validateSubmit(body);
  if (!v.ok) return json(400, { error: v.error });

  const { playerId, name, character, score } = v.value;
  const doc = getDoc();
  const table = getTableName();

  try {
    await doc.send(
      new UpdateCommand({
        TableName: table,
        Key: { playerId },
        UpdateExpression: 'SET #n = :name, #c = :character, score = :score, updatedAt = :ts',
        ConditionExpression: 'attribute_not_exists(score) OR score < :score',
        ExpressionAttributeNames: { '#n': 'name', '#c': 'character' },
        ExpressionAttributeValues: {
          ':name': name,
          ':character': character,
          ':score': score,
          ':ts': Date.now(),
        },
      }),
    );
    return json(200, { accepted: true, newScore: score });
  } catch (err) {
    if (err instanceof ConditionalCheckFailedException) {
      const existing = await doc.send(
        new GetCommand({
          TableName: table,
          Key: { playerId },
          ProjectionExpression: 'score',
        }),
      );
      const serverScore = (existing.Item?.score as number | undefined) ?? 0;
      return json(200, { accepted: false, serverScore });
    }
    console.error('submit-score failed', err);
    return json(500, { error: 'failed to submit score' });
  }
}

export const config = { path: '/.netlify/functions/submit-score' };
