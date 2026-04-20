import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

let _doc: DynamoDBDocumentClient | null = null;

export function getDoc(): DynamoDBDocumentClient {
  if (_doc) return _doc;
  const client = new DynamoDBClient({});
  _doc = DynamoDBDocumentClient.from(client);
  return _doc;
}

export function getTableName(): string {
  const name = process.env.DDB_TABLE_NAME;
  if (!name) throw new Error('DDB_TABLE_NAME env var not set');
  return name;
}

export function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
