import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

let _doc: DynamoDBDocumentClient | null = null;

export function getDoc(): DynamoDBDocumentClient {
  if (_doc) return _doc;
  const client = new DynamoDBClient({
    ...(process.env.BAKRA_AWS_KEY_ID && {
      credentials: {
        accessKeyId: process.env.BAKRA_AWS_KEY_ID,
        secretAccessKey: process.env.BAKRA_AWS_SECRET ?? '',
      },
    }),
    ...(process.env.BAKRA_AWS_REGION && { region: process.env.BAKRA_AWS_REGION }),
  });
  _doc = DynamoDBDocumentClient.from(client);
  return _doc;
}

export function getTableName(): string {
  const name = process.env.BAKRA_DDB_TABLE_NAME;
  if (!name) throw new Error('BAKRA_DDB_TABLE_NAME env var not set');
  return name;
}

export function getEventsTableName(): string {
  const name = process.env.BAKRA_EVENTS_DDB_TABLE_NAME;
  if (!name) throw new Error('BAKRA_EVENTS_DDB_TABLE_NAME env var not set');
  return name;
}

export function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
