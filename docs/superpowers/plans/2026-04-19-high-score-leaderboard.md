# High-Score Leaderboard Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** [2026-04-19-high-score-leaderboard-design.md](../specs/2026-04-19-high-score-leaderboard-design.md)

**Goal:** Replace the trading-card end screen with a DynamoDB-backed global leaderboard. Game becomes endless; scores ≥3 are submitted; #1 gets a celebration screen.

**Architecture:** Frontend (Vite + React + TS) talks to two Netlify Functions (`get-leaderboard`, `submit-score`) which read/write a single DynamoDB table keyed by client-generated UUID. Client gates submits on local personal best; server's conditional `UpdateItem` is the authoritative safety net. Rank detection is client-side via a post-submit leaderboard fetch.

**Tech Stack:** TypeScript, React 18, Vite 6, Netlify Functions (Node 20), AWS DynamoDB, `@aws-sdk/client-dynamodb` + `@aws-sdk/lib-dynamodb`, `uuid`, `vitest` (new) for unit tests, existing `framer-motion` + `tailwindcss` for UI.

**Testing philosophy for this project:** TDD for pure modules with real logic worth testing (identity helpers, name normalization, backend validation). For React screens with canvas + framer-motion, unit-testing adds more ceremony than value — rely on `tsc -b` + manual browser verification via the preview tool. Each chunk ends with `npm run typecheck && npm run build` passing.

**Chunks:**
1. Foundations — dependencies, vitest, shared types, identity helpers
2. Backend — Netlify Functions + AWS setup doc
3. Frontend API + data hook
4. Reusable UI primitives — Leaderboard, NamePromptModal
5. New screens — FirstPlace, Leaderboard, GameOver
6. Game loop conversion — endless mode
7. Integration & cleanup — App.tsx orchestrator, InviteScreen, delete dead files
8. Manual verification + live AWS bring-up

---

## Chunk 1: Foundations

Adds dependencies, wires vitest, creates shared types, and ships the identity layer with tests. Leaves the app compiling (nothing existing is broken).

### Task 1.1: Add production and dev dependencies

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json` (via npm)

- [ ] **Step 1: Install AWS SDK + uuid**

Run:
```bash
npm install @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb uuid
```

- [ ] **Step 2: Install dev dependencies**

Run:
```bash
npm install -D vitest @vitest/ui jsdom @types/uuid
```

- [ ] **Step 3: Remove `html2canvas`**

Run:
```bash
npm uninstall html2canvas
```

- [ ] **Step 4: Add test scripts to `package.json`**

In the `scripts` block, add:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 5: Typecheck**

Run: `npm run typecheck`
Expected: PASS (no code has been changed yet).

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json
git commit -m "Swap html2canvas for AWS SDK, uuid, and vitest"
```

### Task 1.2: Configure vitest

**Files:**
- Create: `vitest.config.ts`

- [ ] **Step 1: Create config**

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: false,
    include: ['src/**/*.test.ts', 'netlify/functions/**/*.test.ts'],
  },
});
```

- [ ] **Step 2: Sanity-check vitest runs**

Run: `npm test`
Expected: PASS with "No test files found" (zero tests, non-zero exit? — if vitest exits non-zero on empty, fix by adding `passWithNoTests: true` in the config).

- [ ] **Step 3: Commit**

```bash
git add vitest.config.ts
git commit -m "Configure vitest with jsdom environment"
```

### Task 1.3: Extend shared types

**Files:**
- Modify: `src/types.ts`

- [ ] **Step 1: Edit types**

Replace the file contents with:

```ts
export type Screen =
  | 'loading'
  | 'invite'
  | 'select'
  | 'game'
  | 'leaderboard'
  | 'gameOver'
  | 'firstPlace';

export type Character = 'eakjot' | 'abel' | 'astro';

export interface PlayerIdentity {
  playerId: string;
  name: string | null;
}

export interface LeaderboardEntry {
  playerId: string;
  name: string;
  character: Character;
  score: number;
  updatedAt: number;
}

export type SubmitScoreResponse =
  | { accepted: true; newScore: number }
  | { accepted: false; serverScore: number };
```

Note: `'won'` and `'card'` are removed from the `Screen` union. This will immediately break `App.tsx` (which still imports `WonScreen`/`CardScreen` and references those screen names). That's fine — we're in a chunk; `App.tsx` gets fixed in Chunk 7. For now, we rely on subsequent chunks keeping typecheck-green by **not running typecheck until after Task 1.5**, OR by adding temporary casts. Simpler: skip typecheck between Task 1.3 and Task 1.5, run it at Task 1.5.

- [ ] **Step 2: Do NOT commit yet** — we'll commit after the identity module compiles alongside it.

### Task 1.4: Write identity helpers (TDD)

**Files:**
- Create: `src/lib/identity.ts`
- Create: `src/lib/identity.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/lib/identity.test.ts`:

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getOrCreatePlayerId,
  getPlayerName,
  setPlayerName,
  getPersonalBest,
  setPersonalBest,
  getLastCharacter,
  setLastCharacter,
  normalizeName,
} from './identity';

describe('identity', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  describe('getOrCreatePlayerId', () => {
    it('creates and persists a v4 UUID on first call', () => {
      const id = getOrCreatePlayerId();
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
      expect(window.localStorage.getItem('bakra:playerId')).toBe(id);
    });

    it('returns the same id on subsequent calls', () => {
      const a = getOrCreatePlayerId();
      const b = getOrCreatePlayerId();
      expect(a).toBe(b);
    });
  });

  describe('player name', () => {
    it('returns null when unset', () => {
      expect(getPlayerName()).toBeNull();
    });

    it('round-trips a name', () => {
      setPlayerName('Bibek');
      expect(getPlayerName()).toBe('Bibek');
    });
  });

  describe('personal best', () => {
    it('returns 0 when unset', () => {
      expect(getPersonalBest()).toBe(0);
    });

    it('round-trips a numeric value', () => {
      setPersonalBest(7);
      expect(getPersonalBest()).toBe(7);
    });

    it('ignores corrupt values', () => {
      window.localStorage.setItem('bakra:personalBest', 'not-a-number');
      expect(getPersonalBest()).toBe(0);
    });
  });

  describe('last character', () => {
    it('returns null when unset', () => {
      expect(getLastCharacter()).toBeNull();
    });

    it('round-trips a character', () => {
      setLastCharacter('astro');
      expect(getLastCharacter()).toBe('astro');
    });

    it('returns null for invalid stored values', () => {
      window.localStorage.setItem('bakra:lastCharacter', 'notachar');
      expect(getLastCharacter()).toBeNull();
    });
  });

  describe('normalizeName', () => {
    it('strips control chars, trims, and rejects empty', () => {
      expect(normalizeName('  Bibek  ')).toBe('Bibek');
      expect(normalizeName('Bi\x00bek')).toBe('Bibek');
      expect(normalizeName('   ')).toBeNull();
      expect(normalizeName('')).toBeNull();
    });

    it('rejects names longer than 20 chars after normalization', () => {
      expect(normalizeName('a'.repeat(21))).toBeNull();
      expect(normalizeName('a'.repeat(20))).toBe('a'.repeat(20));
    });

    it('allows emoji and unicode letters', () => {
      expect(normalizeName('Bíbek 🐐')).toBe('Bíbek 🐐');
    });
  });

  describe('localStorage unavailable', () => {
    it('does not throw when setItem fails', () => {
      const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('quota');
      });
      expect(() => setPlayerName('X')).not.toThrow();
      expect(() => setPersonalBest(3)).not.toThrow();
      expect(() => setLastCharacter('eakjot')).not.toThrow();
      setItem.mockRestore();
    });
  });
});
```

- [ ] **Step 2: Run tests — confirm failure**

Run: `npm test`
Expected: FAIL with "Cannot find module './identity'".

- [ ] **Step 3: Implement `identity.ts`**

Create `src/lib/identity.ts`:

```ts
import { v4 as uuidv4 } from 'uuid';
import type { Character } from '../types';

const KEYS = {
  playerId: 'bakra:playerId',
  playerName: 'bakra:playerName',
  personalBest: 'bakra:personalBest',
  lastCharacter: 'bakra:lastCharacter',
} as const;

const CHARACTERS: readonly Character[] = ['eakjot', 'abel', 'astro'] as const;

function safeGet(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // swallow; identity is best-effort
  }
}

export function getOrCreatePlayerId(): string {
  const existing = safeGet(KEYS.playerId);
  if (existing) return existing;
  const id = uuidv4();
  safeSet(KEYS.playerId, id);
  return id;
}

export function getPlayerName(): string | null {
  const raw = safeGet(KEYS.playerName);
  return raw && raw.length > 0 ? raw : null;
}

export function setPlayerName(name: string): void {
  safeSet(KEYS.playerName, name);
}

export function getPersonalBest(): number {
  const raw = safeGet(KEYS.personalBest);
  if (!raw) return 0;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

export function setPersonalBest(score: number): void {
  safeSet(KEYS.personalBest, String(score));
}

export function getLastCharacter(): Character | null {
  const raw = safeGet(KEYS.lastCharacter);
  return raw && (CHARACTERS as readonly string[]).includes(raw)
    ? (raw as Character)
    : null;
}

export function setLastCharacter(c: Character): void {
  safeSet(KEYS.lastCharacter, c);
}

export function normalizeName(input: string): string | null {
  const stripped = input.replace(/[\x00-\x1F\x7F]/g, '');
  const trimmed = stripped.trim();
  if (trimmed.length < 1 || trimmed.length > 20) return null;
  return trimmed;
}
```

- [ ] **Step 4: Run tests — confirm PASS**

Run: `npm test`
Expected: PASS — all identity tests green.

### Task 1.5: Typecheck + commit foundations

- [ ] **Step 1: Typecheck**

Run: `npm run typecheck`
Expected: FAIL — `App.tsx` still imports deleted screen names. This is expected; Chunk 7 will fix it. Record the errors to confirm they are only about `WonScreen`/`CardScreen`/`'won'`/`'card'`, not anything from our new code.

- [ ] **Step 2: Commit (accept the known transient break)**

```bash
git add src/types.ts src/lib/identity.ts src/lib/identity.test.ts
git commit -m "Add shared types and identity/localStorage helpers

Introduces Screen + Character unions, LeaderboardEntry,
SubmitScoreResponse, and a tested identity module for
playerId/name/PB/lastCharacter persistence. App.tsx still
references soon-to-be-deleted screens; fixed in Chunk 7."
```

---

## Chunk 2: Backend — Netlify Functions

Adds `netlify/functions/{get-leaderboard,submit-score}.ts` with unit tests on the validation path. Ships `docs/aws-setup.md`. Does not touch the frontend.

### Task 2.1: Netlify functions scaffolding

**Files:**
- Create: `netlify/functions/_shared.ts`

- [ ] **Step 1: Create shared helper**

```ts
// netlify/functions/_shared.ts
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
```

Note: the AWS SDK v3 default credential chain reads `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION` from `process.env` automatically when running in Netlify Functions. No explicit `credentials: { ... }` needed.

- [ ] **Step 2: Commit**

```bash
git add netlify/functions/_shared.ts
git commit -m "Add shared DynamoDB client helper for Netlify functions"
```

### Task 2.2: `get-leaderboard` function

**Files:**
- Create: `netlify/functions/get-leaderboard.ts`

- [ ] **Step 1: Implement**

```ts
// netlify/functions/get-leaderboard.ts
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
```

- [ ] **Step 2: Commit**

```bash
git add netlify/functions/get-leaderboard.ts
git commit -m "Add get-leaderboard Netlify function"
```

### Task 2.3: `submit-score` validation (TDD)

**Files:**
- Create: `netlify/functions/submit-score.validate.ts`
- Create: `netlify/functions/submit-score.validate.test.ts`

Splitting validation into its own module keeps it pure and unit-testable.

- [ ] **Step 1: Write failing tests**

```ts
// netlify/functions/submit-score.validate.test.ts
import { describe, it, expect } from 'vitest';
import { validateSubmit } from './submit-score.validate';

const ok = {
  playerId: '550e8400-e29b-41d4-a716-446655440000',
  name: 'Bibek',
  character: 'eakjot',
  score: 5,
};

describe('validateSubmit', () => {
  it('accepts a well-formed payload', () => {
    const r = validateSubmit(ok);
    expect(r.ok).toBe(true);
  });

  it('rejects non-v4 UUID', () => {
    const r = validateSubmit({ ...ok, playerId: 'not-a-uuid' });
    expect(r.ok).toBe(false);
  });

  it('rejects names with only control chars', () => {
    const r = validateSubmit({ ...ok, name: '\x00\x01' });
    expect(r.ok).toBe(false);
  });

  it('trims and accepts padded names', () => {
    const r = validateSubmit({ ...ok, name: '  Bibek  ' });
    expect(r.ok && r.value.name).toBe('Bibek');
  });

  it('rejects names >20 chars after normalization', () => {
    const r = validateSubmit({ ...ok, name: 'a'.repeat(21) });
    expect(r.ok).toBe(false);
  });

  it('rejects unknown character', () => {
    const r = validateSubmit({ ...ok, character: 'goat' });
    expect(r.ok).toBe(false);
  });

  it('rejects score below 3', () => {
    const r = validateSubmit({ ...ok, score: 2 });
    expect(r.ok).toBe(false);
  });

  it('rejects score above 10000', () => {
    const r = validateSubmit({ ...ok, score: 10001 });
    expect(r.ok).toBe(false);
  });

  it('rejects non-integer score', () => {
    const r = validateSubmit({ ...ok, score: 3.5 });
    expect(r.ok).toBe(false);
  });

  it('rejects non-object input', () => {
    expect(validateSubmit(null).ok).toBe(false);
    expect(validateSubmit('abc').ok).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests — confirm FAIL**

Run: `npm test`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement validator**

```ts
// netlify/functions/submit-score.validate.ts
import type { Character } from '../../src/types';

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const CHARACTERS: Character[] = ['eakjot', 'abel', 'astro'];

export interface ValidSubmit {
  playerId: string;
  name: string;
  character: Character;
  score: number;
}

export type ValidateResult =
  | { ok: true; value: ValidSubmit }
  | { ok: false; error: string };

function normalizeName(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  const stripped = input.replace(/[\x00-\x1F\x7F]/g, '');
  const trimmed = stripped.trim();
  if (trimmed.length < 1 || trimmed.length > 20) return null;
  return trimmed;
}

export function validateSubmit(raw: unknown): ValidateResult {
  if (!raw || typeof raw !== 'object') return { ok: false, error: 'body must be an object' };
  const b = raw as Record<string, unknown>;

  if (typeof b.playerId !== 'string' || !UUID_V4.test(b.playerId)) {
    return { ok: false, error: 'invalid playerId' };
  }
  const name = normalizeName(b.name);
  if (!name) return { ok: false, error: 'invalid name' };

  if (typeof b.character !== 'string' || !CHARACTERS.includes(b.character as Character)) {
    return { ok: false, error: 'invalid character' };
  }
  if (
    typeof b.score !== 'number' ||
    !Number.isInteger(b.score) ||
    b.score < 3 ||
    b.score > 10000
  ) {
    return { ok: false, error: 'invalid score' };
  }

  return {
    ok: true,
    value: {
      playerId: b.playerId,
      name,
      character: b.character as Character,
      score: b.score,
    },
  };
}
```

- [ ] **Step 4: Run tests — confirm PASS**

Run: `npm test`
Expected: all validate tests pass.

- [ ] **Step 5: Commit**

```bash
git add netlify/functions/submit-score.validate.ts netlify/functions/submit-score.validate.test.ts
git commit -m "Add validated submit-score payload schema (TDD)"
```

### Task 2.4: `submit-score` handler

**Files:**
- Create: `netlify/functions/submit-score.ts`

- [ ] **Step 1: Implement**

```ts
// netlify/functions/submit-score.ts
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
```

- [ ] **Step 2: Commit**

```bash
git add netlify/functions/submit-score.ts
git commit -m "Add submit-score Netlify function with conditional write"
```

### Task 2.5: AWS setup doc

**Files:**
- Create: `docs/aws-setup.md`

- [ ] **Step 1: Write doc**

```md
# AWS / Netlify setup — bakra-party leaderboard

One-time manual steps to wire up the DynamoDB table + IAM credentials for the leaderboard functions.

## 1. Create the DynamoDB table

AWS Console → DynamoDB → Create table.

- **Table name:** `bakra-party-scores`
- **Partition key:** `playerId` (String)
- **Sort key:** (none)
- **Capacity mode:** On-demand

No GSIs, no TTL, no encryption customization needed.

## 2. Create the IAM user + policy

AWS Console → IAM → Users → Create user `bakra-party-netlify`.

- Skip "provide user access to console".
- Attach policy (inline) with exactly this JSON (replace `<YOUR_REGION>` and `<YOUR_ACCOUNT_ID>`):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:UpdateItem",
        "dynamodb:Scan"
      ],
      "Resource": "arn:aws:dynamodb:<YOUR_REGION>:<YOUR_ACCOUNT_ID>:table/bakra-party-scores"
    }
  ]
}
```

- After the user is created: Security credentials → Create access key → "Application running outside AWS". Save the access key ID + secret in a password manager — you only see the secret once.

## 3. Netlify environment variables

Netlify dashboard → Site configuration → Environment variables → Add:

| Key | Value |
|---|---|
| `AWS_ACCESS_KEY_ID` | from step 2 |
| `AWS_SECRET_ACCESS_KEY` | from step 2 |
| `AWS_REGION` | e.g. `us-east-1` — must match the table's region |
| `DDB_TABLE_NAME` | `bakra-party-scores` |

Redeploy the site after adding the vars.

## 4. Smoke test

After redeploy:

```bash
curl https://<your-site>.netlify.app/.netlify/functions/get-leaderboard
# -> {"entries":[]}
```

A first `submit-score` call will populate the table; re-hit `get-leaderboard` to verify the new row appears.

## Teardown

After the event: delete the DynamoDB table (removes all scores + storage) and deactivate/delete the IAM user's access key.
```

- [ ] **Step 2: Commit**

```bash
git add docs/aws-setup.md
git commit -m "Document one-time AWS + Netlify setup for leaderboard"
```

---

## Chunk 3: Frontend API + data hook

Adds the typed client for the two functions, plus a React hook. Tests use `vi.spyOn(global, 'fetch')` — no real network calls.

### Task 3.1: `leaderboardApi.ts` (TDD)

**Files:**
- Create: `src/lib/leaderboardApi.ts`
- Create: `src/lib/leaderboardApi.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// src/lib/leaderboardApi.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { fetchLeaderboard, submitScore } from './leaderboardApi';

describe('leaderboardApi', () => {
  afterEach(() => vi.restoreAllMocks());

  describe('fetchLeaderboard', () => {
    it('returns entries on success', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify({ entries: [{ playerId: 'a', name: 'A', character: 'eakjot', score: 5, updatedAt: 1 }] }), { status: 200 }),
      );
      const entries = await fetchLeaderboard();
      expect(entries).toHaveLength(1);
      expect(entries[0].score).toBe(5);
    });

    it('returns [] on server error', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValueOnce(new Response('{}', { status: 500 }));
      const entries = await fetchLeaderboard();
      expect(entries).toEqual([]);
    });

    it('returns [] on network error', async () => {
      vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('offline'));
      const entries = await fetchLeaderboard();
      expect(entries).toEqual([]);
    });
  });

  describe('submitScore', () => {
    const payload = { playerId: '550e8400-e29b-41d4-a716-446655440000', name: 'A', character: 'eakjot' as const, score: 4 };

    it('returns accepted on 200 {accepted:true}', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify({ accepted: true, newScore: 4 }), { status: 200 }),
      );
      const r = await submitScore(payload);
      expect(r).toEqual({ accepted: true, newScore: 4 });
    });

    it('returns rejected on 200 {accepted:false}', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify({ accepted: false, serverScore: 9 }), { status: 200 }),
      );
      const r = await submitScore(payload);
      expect(r).toEqual({ accepted: false, serverScore: 9 });
    });

    it('throws on non-200', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValueOnce(new Response('{}', { status: 500 }));
      await expect(submitScore(payload)).rejects.toThrow();
    });
  });
});
```

- [ ] **Step 2: Run — confirm FAIL**

Run: `npm test`
Expected: FAIL — module missing.

- [ ] **Step 3: Implement**

```ts
// src/lib/leaderboardApi.ts
import type { Character, LeaderboardEntry, SubmitScoreResponse } from '../types';

const GET_URL = '/.netlify/functions/get-leaderboard';
const SUBMIT_URL = '/.netlify/functions/submit-score';

export async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  try {
    const res = await fetch(GET_URL);
    if (!res.ok) return [];
    const body = (await res.json()) as { entries?: LeaderboardEntry[] };
    return body.entries ?? [];
  } catch {
    return [];
  }
}

export interface SubmitScoreParams {
  playerId: string;
  name: string;
  character: Character;
  score: number;
}

export async function submitScore(params: SubmitScoreParams): Promise<SubmitScoreResponse> {
  const res = await fetch(SUBMIT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(`submitScore ${res.status}`);
  return (await res.json()) as SubmitScoreResponse;
}
```

- [ ] **Step 4: Run — confirm PASS**

Run: `npm test`
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/leaderboardApi.ts src/lib/leaderboardApi.test.ts
git commit -m "Add leaderboardApi client with tested error handling"
```

### Task 3.2: `useLeaderboard` hook

**Files:**
- Create: `src/hooks/useLeaderboard.ts`

No tests for this — trivial wrapper, covered by manual QA in Chunk 8.

- [ ] **Step 1: Implement**

```ts
// src/hooks/useLeaderboard.ts
import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchLeaderboard } from '../lib/leaderboardApi';
import type { LeaderboardEntry } from '../types';

interface Options {
  initialEntries?: LeaderboardEntry[];
  /** Skip the initial mount-time fetch (useful when caller already has fresh data). */
  skipInitialFetch?: boolean;
}

interface Result {
  entries: LeaderboardEntry[];
  loading: boolean;
  error: boolean;
  refetch: () => Promise<void>;
}

export function useLeaderboard(opts: Options = {}): Result {
  const [entries, setEntries] = useState<LeaderboardEntry[]>(opts.initialEntries ?? []);
  const [loading, setLoading] = useState(!opts.skipInitialFetch);
  const [error, setError] = useState(false);
  const aborted = useRef(false);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(false);
    const rows = await fetchLeaderboard();
    if (aborted.current) return;
    if (rows.length === 0 && !opts.initialEntries) {
      // `fetchLeaderboard` already swallows errors to `[]`; treat empty on the very first
      // load as "no error, no data yet" — but only downgrade to error if we truly got nothing.
      // In practice the UI can render "No scores yet — be the first!"; the `error` flag stays
      // reserved for actual fetch failures when we can distinguish them later.
    }
    setEntries(rows);
    setLoading(false);
  }, [opts.initialEntries]);

  useEffect(() => {
    aborted.current = false;
    if (!opts.skipInitialFetch) void refetch();
    return () => {
      aborted.current = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { entries, loading, error, refetch };
}
```

- [ ] **Step 2: Typecheck (partial — App.tsx still broken)**

Run: `npx tsc --noEmit -p tsconfig.app.json 2>&1 | grep -v "App.tsx\|WonScreen\|CardScreen"` and verify no other errors.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useLeaderboard.ts
git commit -m "Add useLeaderboard hook"
```

---

## Chunk 4: Reusable UI — Leaderboard table + NamePromptModal

Pure presentational components + a modal. Styled in line with the western theme.

### Task 4.1: `Leaderboard` component

**Files:**
- Create: `src/components/Leaderboard.tsx`

- [ ] **Step 1: Implement**

```tsx
// src/components/Leaderboard.tsx
import type { Character, LeaderboardEntry } from '../types';

interface Props {
  entries: LeaderboardEntry[];
  highlightPlayerId?: string | null;
  loading?: boolean;
  maxVisible?: number;
}

const EMOJI: Record<Character, string> = {
  eakjot: '🤠',
  abel: '🐐',
  astro: '🚀',
};

export function Leaderboard({
  entries,
  highlightPlayerId,
  loading = false,
  maxVisible = 10,
}: Props) {
  if (loading && entries.length === 0) {
    return (
      <div className="text-center text-[12px] text-parchment/60 py-6">
        loading leaderboard…
      </div>
    );
  }

  if (!loading && entries.length === 0) {
    return (
      <div className="text-center text-[12px] text-parchment/60 py-6">
        no scores yet — be the first goat.
      </div>
    );
  }

  const cap = maxVisible;
  const visibleClass =
    entries.length > cap
      ? 'max-h-[calc(var(--row-h)*10)] overflow-y-auto pr-1'
      : '';

  return (
    <div
      className={`w-full ${visibleClass}`}
      style={{ ['--row-h' as string]: '44px' }}
    >
      <ul className="divide-y divide-brass/15">
        {entries.map((e, i) => {
          const highlighted = e.playerId === highlightPlayerId;
          return (
            <li
              key={e.playerId}
              className={[
                'grid grid-cols-[40px_1fr_auto] items-center gap-3 h-[44px] px-3',
                highlighted ? 'bg-brass/15 rounded-lg' : '',
              ].join(' ')}
            >
              <span className="font-mono font-black text-[14px] text-brass tabular">
                {i + 1}
              </span>
              <span className="flex items-center gap-2 min-w-0">
                <span aria-hidden className="text-[18px] leading-none">
                  {EMOJI[e.character] ?? '🐐'}
                </span>
                <span className="truncate text-[13px] text-parchment">
                  {e.name}
                </span>
              </span>
              <span className="font-mono font-black text-[14px] text-brass tabular">
                {e.score}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Leaderboard.tsx
git commit -m "Add Leaderboard presentational component"
```

### Task 4.2: `NamePromptModal` component

**Files:**
- Create: `src/components/NamePromptModal.tsx`

- [ ] **Step 1: Implement**

```tsx
// src/components/NamePromptModal.tsx
import { useState } from 'react';
import { normalizeName } from '../lib/identity';

interface Props {
  onSubmit: (name: string) => void;
}

export function NamePromptModal({ onSubmit }: Props) {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = normalizeName(value);
    if (!normalized) {
      setError('1–20 characters, please.');
      return;
    }
    onSubmit(normalized);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-bg/85 backdrop-blur-sm px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="name-prompt-title"
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-[320px] rounded-2xl border border-brass/30 bg-bg p-6 shadow-[0_12px_30px_rgba(0,0,0,0.6)]"
      >
        <h3
          id="name-prompt-title"
          className="display-headline text-center"
          style={{ fontSize: 'clamp(22px, 6vw, 28px)' }}
        >
          NAME YOUR GOAT
        </h3>
        <p className="mt-2 text-center text-[11px] tracking-[0.3em] uppercase text-parchment/70">
          saved on this device · shown on the leaderboard
        </p>
        <input
          autoFocus
          type="text"
          maxLength={40}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (error) setError(null);
          }}
          placeholder="Bibek"
          className="mt-5 w-full rounded-lg border border-brass/40 bg-parchment/5 px-3 py-3 text-[16px] text-parchment outline-none focus:border-brass"
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? 'name-error' : undefined}
        />
        {error && (
          <div id="name-error" className="mt-2 text-[12px] text-rust">
            {error}
          </div>
        )}
        <button type="submit" className="btn-western mt-5">
          Save &amp; Submit
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/NamePromptModal.tsx
git commit -m "Add NamePromptModal overlay"
```

---

## Chunk 5: New screens

`FirstPlaceScreen` (ported from `WonScreen`'s visuals), `LeaderboardScreen` (standalone), `GameOverScreen` (the new terminal flow).

### Task 5.1: `FirstPlaceScreen`

**Files:**
- Create: `src/screens/FirstPlaceScreen.tsx`

- [ ] **Step 1: Implement (ports `WonScreen`'s medal/confetti/rays)**

```tsx
// src/screens/FirstPlaceScreen.tsx
import { useMemo } from 'react';
import { DividerFancy, RaysBurst, StarBadge } from '../components/Ornaments';

const EMOJIS = ['🐐', '⭐', '✨', '🎉', '🏆', '🔥'];

function makeConfetti(n: number) {
  return Array.from({ length: n }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
    delay: Math.random() * 2,
    duration: 2.5 + Math.random() * 2,
  }));
}

interface Props {
  score: number;
  onContinue: () => void;
}

export function FirstPlaceScreen({ score, onContinue }: Props) {
  const pieces = useMemo(() => makeConfetti(60), []);

  return (
    <div className="relative min-h-dvh w-full max-w-app mx-auto px-6 pt-10 pb-10 flex flex-col items-center justify-center overflow-hidden text-center">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="confetti-piece"
          style={
            {
              left: `${p.left}%`,
              ['--delay' as string]: `${p.delay}s`,
              ['--dur' as string]: `${p.duration}s`,
            } as React.CSSProperties
          }
          aria-hidden
        >
          {p.emoji}
        </span>
      ))}

      <div className="relative w-[280px] h-[280px] flex items-center justify-center">
        <div className="absolute inset-0 overflow-hidden rounded-full">
          <RaysBurst
            className="absolute inset-[-20%] motion-safe:animate-[rays-pulse_5s_ease-in-out_infinite]"
            color="#D4A017"
            count={32}
            style={{ opacity: 0.75 }}
          />
        </div>
        <div
          className="relative w-[190px] h-[190px] rounded-full flex items-center justify-center motion-safe:animate-pop-in"
          style={{
            background:
              'radial-gradient(circle at 40% 30%, #f1c238 0%, #D4A017 60%, #8b6a0f 100%)',
            border: '5px solid #8b3a1f',
            boxShadow:
              '0 14px 30px rgba(0,0,0,0.6), inset 0 3px 0 rgba(255,255,255,0.4), inset 0 -3px 0 rgba(0,0,0,0.2)',
          }}
        >
          <div
            className="absolute inset-3 rounded-full border-2 border-dashed"
            style={{ borderColor: 'rgba(139,58,31,0.5)' }}
          />
          <span className="text-[110px] leading-none relative z-10" aria-hidden>
            🏆
          </span>
          <StarBadge size={44} className="absolute -top-3 -left-3 drop-shadow-lg" />
          <StarBadge size={38} className="absolute -bottom-2 -right-3 drop-shadow-lg" />
        </div>
      </div>

      <div className="mt-4 text-[10px] tracking-[0.45em] text-brass font-black uppercase">
        ★ Top of the Herd ★
      </div>

      <h2
        className="mt-3 display-headline"
        style={{ fontSize: 'clamp(40px, 11vw, 52px)' }}
      >
        NEW #1
        <br />
        GOAT
      </h2>

      <div className="mt-4 font-mono font-black text-[32px] text-brass tabular">
        {score}
      </div>

      <div className="mt-5 w-full max-w-[320px]">
        <DividerFancy label="THE LEGEND GROWS" />
      </div>

      <button type="button" onClick={onContinue} className="btn-western mt-9 max-w-[320px]">
        Continue
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/screens/FirstPlaceScreen.tsx
git commit -m "Add FirstPlaceScreen celebration (ported from WonScreen)"
```

### Task 5.2: `LeaderboardScreen`

**Files:**
- Create: `src/screens/LeaderboardScreen.tsx`

- [ ] **Step 1: Implement**

```tsx
// src/screens/LeaderboardScreen.tsx
import { Leaderboard } from '../components/Leaderboard';
import { useLeaderboard } from '../hooks/useLeaderboard';
import { getOrCreatePlayerId } from '../lib/identity';

interface Props {
  onBack: () => void;
}

export function LeaderboardScreen({ onBack }: Props) {
  const { entries, loading } = useLeaderboard();
  const playerId = typeof window !== 'undefined' ? getOrCreatePlayerId() : null;

  return (
    <div className="min-h-dvh w-full max-w-app mx-auto px-6 pt-10 pb-10 flex flex-col">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to invite"
          className="text-[12px] uppercase tracking-[0.2em] text-parchment/80 inline-flex items-center gap-1 min-h-[44px] min-w-[44px] px-3 -ml-3 rounded-lg active:bg-parchment/5 font-bold"
        >
          ← back
        </button>
        <div className="text-center flex-1">
          <div className="text-[10px] tracking-[0.45em] uppercase text-brass font-black">
            ◈ Hall of Goats ◈
          </div>
          <h2
            className="display-headline mt-1"
            style={{ fontSize: 'clamp(26px, 7vw, 32px)' }}
          >
            LEADERBOARD
          </h2>
        </div>
        <div className="w-[48px]" aria-hidden />
      </div>

      <div className="mt-8 flex-1">
        <Leaderboard entries={entries} loading={loading} highlightPlayerId={playerId} />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/screens/LeaderboardScreen.tsx
git commit -m "Add standalone LeaderboardScreen"
```

### Task 5.3: `GameOverScreen`

**Files:**
- Create: `src/screens/GameOverScreen.tsx`

- [ ] **Step 1: Implement**

```tsx
// src/screens/GameOverScreen.tsx
import { useEffect, useState } from 'react';
import type { LeaderboardEntry } from '../types';
import { Leaderboard } from '../components/Leaderboard';
import { NamePromptModal } from '../components/NamePromptModal';

export type SubmitStatus =
  | { kind: 'noop' }       // score < 3 or already at PB
  | { kind: 'pending' }
  | { kind: 'accepted' }
  | { kind: 'server-was-higher' }
  | { kind: 'network-error' };

interface Props {
  score: number;
  personalBest: number;
  isNewBest: boolean;
  submitStatus: SubmitStatus;
  playerId: string;
  entries: LeaderboardEntry[];
  entriesLoading: boolean;
  playerName: string | null;
  onProvideName: (name: string) => void;
  onPlayAgain: () => void;
  onBackToInvite: () => void;
}

export function GameOverScreen({
  score,
  personalBest,
  isNewBest,
  submitStatus,
  playerId,
  entries,
  entriesLoading,
  playerName,
  onProvideName,
  onPlayAgain,
  onBackToInvite,
}: Props) {
  const needsName = score >= 3 && !playerName;
  const tooLowToSubmit = score < 3;

  return (
    <div className="relative min-h-dvh w-full max-w-app mx-auto px-6 pt-10 pb-10 flex flex-col">
      <div className="text-center">
        <div className="text-[10px] tracking-[0.45em] uppercase text-brass font-black">
          ◈ Game Over ◈
        </div>
        <h2
          className="display-headline mt-1"
          style={{ fontSize: 'clamp(28px, 8vw, 36px)' }}
        >
          {tooLowToSubmit ? 'WARM UP' : 'NICE RUN'}
        </h2>
      </div>

      <div className="mt-6 text-center">
        <div className="font-mono font-black text-[56px] text-brass leading-none tabular">
          {score}
        </div>
        <div className="mt-2 text-[11px] uppercase tracking-[0.3em] text-parchment/70">
          {tooLowToSubmit
            ? 'need 3+ to make the board'
            : isNewBest
              ? '★ New personal best ★'
              : `personal best · ${personalBest}`}
        </div>
        {submitStatus.kind === 'network-error' && (
          <div className="mt-2 text-[11px] text-rust">
            couldn't save to leaderboard — you're still a goat though
          </div>
        )}
      </div>

      <div className="mt-8 flex-1">
        <div className="text-center text-[10px] tracking-[0.45em] uppercase text-brass font-black mb-3">
          ✦ Top Goats ✦
        </div>
        <Leaderboard
          entries={entries}
          loading={entriesLoading}
          highlightPlayerId={playerId}
        />
      </div>

      <div className="mt-8 space-y-3">
        <button type="button" onClick={onPlayAgain} className="btn-western">
          Play Again
        </button>
        <button
          type="button"
          onClick={onBackToInvite}
          className="mt-2 mx-auto text-[12px] text-parchment/75 underline underline-offset-4 block min-h-[44px] px-4 rounded-lg active:bg-parchment/5"
        >
          ← back to invite
        </button>
      </div>

      {needsName && <NamePromptModal onSubmit={onProvideName} />}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/screens/GameOverScreen.tsx
git commit -m "Add GameOverScreen with inline leaderboard + name modal"
```

---

## Chunk 6: Game loop — endless mode

Removes `WIN_SCORE` short-circuit. Renames `onWin` → `onGameEnd(score)`. Updates overlay copy.

### Task 6.1: Remove `WIN_SCORE` from renderer

**Files:**
- Modify: `src/game/renderer.ts`

- [ ] **Step 1: Delete the `WIN_SCORE` export**

In `src/game/renderer.ts`, delete line 11 (`export const WIN_SCORE = 3;`).

- [ ] **Step 2: Commit**

```bash
git add src/game/renderer.ts
git commit -m "Remove WIN_SCORE from renderer — game is now endless"
```

### Task 6.2: Convert `FlappyBakra` to endless

**Files:**
- Modify: `src/game/FlappyBakra.tsx`

- [ ] **Step 1: Change the import list**

On line ~15 of `src/game/FlappyBakra.tsx`, remove `WIN_SCORE,` from the imports from `./renderer`.

- [ ] **Step 2: Change the prop type**

Replace:
```ts
onWin: () => void;
```
with:
```ts
onGameEnd: (score: number) => void;
```

Rename the destructured arg in the component signature from `onWin` to `onGameEnd`.

- [ ] **Step 3: Remove the win branch in `stateRef`**

Delete `winTriggered: false,` and `winDelayAt: 0,` from both the initial `useRef` state object and the `reset()` function's reset block.

- [ ] **Step 4: Delete win detection in the loop**

Remove the entire `if (s.score >= WIN_SCORE && !s.winTriggered) { ... }` block (lines ~140–146). Keep the `sound.play('score')` and `onScore(s.score)` calls; they still fire every pipe.

- [ ] **Step 5: Simplify the collision → gameover transition**

Replace the existing collision block:

```ts
if ((hitFloor || hitCeiling || hitPipe) && !s.winTriggered) {
  s.phase = 'gameover';
  sound.play('death');
}
```

with:

```ts
if (hitFloor || hitCeiling || hitPipe) {
  if (s.phase === 'playing') {
    s.phase = 'gameover';
    sound.play('death');
    onGameEnd(s.score);
  }
}
```

The `onGameEnd` call is wrapped in the `playing → gameover` transition so it only fires once per death.

- [ ] **Step 6: Collapse the gameover overlay branches**

Delete the entire `if (s.winTriggered) { ... } else { ... }` split inside the `s.phase === 'gameover'` branch. Replace with just the "game over" overlay:

```ts
drawOverlay(
  ctx,
  [
    { text: '✦ GAME OVER ✦', size: 14, color: '#8b3a1f', weight: 700 },
    { text: 'YOU GOT GOATED', size: 28, color: '#D4A017', font: 'rye', shadow: true },
    { text: `score · ${s.score}`, size: 14, color: '#FFF8E7', weight: 700, font: 'mono' },
    { text: 'tap to try again', size: 12, color: '#FFF8E7', weight: 500 },
  ],
  0.82,
);
```

Also delete the `if (performance.now() - s.winDelayAt >= 1000) { onWin(); ... }` block entirely.

- [ ] **Step 7: Fix the "waiting" overlay copy**

In the `s.phase === 'waiting'` branch, change the third line:

```ts
{ text: 'dodge 3 pipes to unlock the card', size: 12, color: '#FFF8E7', weight: 500 },
```

to:

```ts
{ text: 'how high can you fly?', size: 12, color: '#FFF8E7', weight: 500 },
```

- [ ] **Step 8: Update the effect dep array**

Change the `useEffect` deps at the end from `[charCfg, sound, onScore, onWin]` to `[charCfg, sound, onScore, onGameEnd]`.

- [ ] **Step 9: Commit**

```bash
git add src/game/FlappyBakra.tsx
git commit -m "Convert FlappyBakra to endless mode

Collisions now dispatch onGameEnd(score) exactly once; the win branch
and victory-delay logic are removed."
```

### Task 6.3: `GameScreen` prop rename

**Files:**
- Modify: `src/screens/GameScreen.tsx`

- [ ] **Step 1: Rename the prop**

Change:
```ts
interface Props {
  character: Character;
  onBack: () => void;
  onWin: () => void;
  sound: UseSound;
}
```
to:
```ts
interface Props {
  character: Character;
  onBack: () => void;
  onGameEnd: (score: number) => void;
  sound: UseSound;
}
```

Update the destructured name in the function signature. Pass `onGameEnd={onGameEnd}` to `<FlappyBakra />` (instead of `onWin`).

- [ ] **Step 2: Remove the "target: 3" label**

Delete the `<div>` with `target: 3` under the score counter (the inner `<div className="text-[10px] uppercase tracking-[0.25em] text-parchment/75 mt-1 font-medium">target: 3</div>`).

- [ ] **Step 3: Commit**

```bash
git add src/screens/GameScreen.tsx
git commit -m "Rename GameScreen onWin→onGameEnd, drop target: 3 label"
```

---

## Chunk 7: Integration — `App.tsx` orchestration + InviteScreen + cleanup

This is the capstone chunk. After it, the app compiles and works end-to-end.

### Task 7.1: InviteScreen — add leaderboard link + update subtitle

**Files:**
- Modify: `src/screens/InviteScreen.tsx`

- [ ] **Step 1: Add `onViewLeaderboard` prop**

Update `InviteScreen`'s props:

```ts
interface Props {
  onStart: () => void;
  onViewLeaderboard: () => void;
  sound: UseSound;
}
```

- [ ] **Step 2: Render the link under the primary button**

Locate the CTA block (currently `<button type="button" onClick={handleCTA} className="btn-western">Play Flappy Bakra</button>`). Immediately after that button, add:

```tsx
<button
  type="button"
  onClick={() => {
    sound.play('tap');
    onViewLeaderboard();
  }}
  className="mt-3 w-full text-[12px] text-parchment/75 underline underline-offset-4 min-h-[44px] px-4 rounded-lg active:bg-parchment/5"
>
  View Leaderboard →
</button>
```

- [ ] **Step 3: Update the subtitle line**

Change the footer hint text from:
```
tap around for goat rain · pass 3 pipes to unlock your card
```
to:
```
tap around for goat rain · flap your way onto the leaderboard
```

- [ ] **Step 4: Commit**

```bash
git add src/screens/InviteScreen.tsx
git commit -m "InviteScreen: add View Leaderboard link + update subtitle"
```

### Task 7.2: App.tsx — rewrite routing + orchestrator

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Replace the whole file**

Because the change touches imports, state, routing, and callback wiring, a full rewrite is cleaner than piecemeal edits. Use:

```tsx
// src/App.tsx
import { useCallback, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { Character, LeaderboardEntry, Screen } from './types';
import { useFirstVisit } from './hooks/useFirstVisit';
import { useSound } from './hooks/useSound';
import { LoadingScreen } from './screens/LoadingScreen';
import { InviteScreen } from './screens/InviteScreen';
import { CharacterSelectScreen } from './screens/CharacterSelectScreen';
import { GameScreen } from './screens/GameScreen';
import { GameOverScreen, type SubmitStatus } from './screens/GameOverScreen';
import { FirstPlaceScreen } from './screens/FirstPlaceScreen';
import { LeaderboardScreen } from './screens/LeaderboardScreen';
import { SoundToggle } from './components/SoundToggle';
import {
  getOrCreatePlayerId,
  getPlayerName,
  setPlayerName,
  getPersonalBest,
  setPersonalBest,
  setLastCharacter,
} from './lib/identity';
import { fetchLeaderboard, submitScore } from './lib/leaderboardApi';

interface RunState {
  score: number;
  personalBest: number;
  isNewBest: boolean;
  submitStatus: SubmitStatus;
  entries: LeaderboardEntry[];
  entriesLoading: boolean;
  playerName: string | null;
}

const emptyRun: RunState = {
  score: 0,
  personalBest: 0,
  isNewBest: false,
  submitStatus: { kind: 'noop' },
  entries: [],
  entriesLoading: false,
  playerName: null,
};

export default function App() {
  const { isFirstVisit, markVisited } = useFirstVisit();
  const [screen, setScreen] = useState<Screen>(isFirstVisit ? 'loading' : 'invite');
  const [character, setCharacter] = useState<Character | null>(null);
  const [run, setRun] = useState<RunState>(emptyRun);
  const sound = useSound();

  const handleLoadingDone = useCallback(() => {
    markVisited();
    setScreen('invite');
  }, [markVisited]);

  const submitIfQualified = useCallback(
    async (score: number, playerName: string, char: Character) => {
      const playerId = getOrCreatePlayerId();
      const priorBest = getPersonalBest();

      let submitStatus: SubmitStatus = { kind: 'noop' };
      let newBest = priorBest;

      if (score > priorBest) {
        submitStatus = { kind: 'pending' };
        try {
          const res = await submitScore({ playerId, name: playerName, character: char, score });
          if (res.accepted) {
            newBest = res.newScore;
            setPersonalBest(newBest);
            submitStatus = { kind: 'accepted' };
          } else {
            newBest = Math.max(priorBest, res.serverScore);
            setPersonalBest(newBest);
            submitStatus = { kind: 'server-was-higher' };
          }
        } catch {
          newBest = score;
          setPersonalBest(newBest);
          submitStatus = { kind: 'network-error' };
        }
      }

      const entries = await fetchLeaderboard();
      const topIsPlayer =
        submitStatus.kind === 'accepted' &&
        entries.length > 0 &&
        entries[0].playerId === playerId;

      setRun({
        score,
        personalBest: newBest,
        isNewBest: score > priorBest && submitStatus.kind === 'accepted',
        submitStatus,
        entries,
        entriesLoading: false,
        playerName,
      });

      setScreen(topIsPlayer ? 'firstPlace' : 'gameOver');
    },
    [],
  );

  const handleGameEnd = useCallback(
    async (score: number) => {
      if (!character) return;

      if (score < 3) {
        setRun({
          ...emptyRun,
          score,
          personalBest: getPersonalBest(),
          playerName: getPlayerName(),
        });
        setScreen('gameOver');
        return;
      }

      const playerName = getPlayerName();
      if (!playerName) {
        // Route to gameOver first with a pending-ish state; modal blocks until name provided.
        setRun({
          ...emptyRun,
          score,
          personalBest: getPersonalBest(),
          playerName: null,
          entriesLoading: true,
        });
        setScreen('gameOver');
        // Pre-fetch the leaderboard while the user is typing.
        const entries = await fetchLeaderboard();
        setRun((r) => ({ ...r, entries, entriesLoading: false }));
        return;
      }

      await submitIfQualified(score, playerName, character);
    },
    [character, submitIfQualified],
  );

  const handleProvideName = useCallback(
    async (name: string) => {
      setPlayerName(name);
      if (!character) return;
      await submitIfQualified(run.score, name, character);
    },
    [character, run.score, submitIfQualified],
  );

  const fade = {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -8 },
    transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] as const },
  };

  return (
    <div className="min-h-dvh bg-bg text-parchment relative">
      {screen !== 'loading' && <SoundToggle sound={sound} />}

      <AnimatePresence mode="wait">
        {screen === 'loading' && (
          <motion.div key="loading" {...fade}>
            <LoadingScreen onComplete={handleLoadingDone} />
          </motion.div>
        )}
        {screen === 'invite' && (
          <motion.div key="invite" {...fade}>
            <InviteScreen
              onStart={() => setScreen('select')}
              onViewLeaderboard={() => setScreen('leaderboard')}
              sound={sound}
            />
          </motion.div>
        )}
        {screen === 'leaderboard' && (
          <motion.div key="leaderboard" {...fade}>
            <LeaderboardScreen onBack={() => setScreen('invite')} />
          </motion.div>
        )}
        {screen === 'select' && (
          <motion.div key="select" {...fade}>
            <CharacterSelectScreen
              onBack={() => setScreen('invite')}
              onConfirm={(c) => {
                setCharacter(c);
                setLastCharacter(c);
                setScreen('game');
              }}
              sound={sound}
            />
          </motion.div>
        )}
        {screen === 'game' && character && (
          <motion.div key="game" {...fade}>
            <GameScreen
              character={character}
              sound={sound}
              onBack={() => setScreen('invite')}
              onGameEnd={handleGameEnd}
            />
          </motion.div>
        )}
        {screen === 'gameOver' && (
          <motion.div key="gameOver" {...fade}>
            <GameOverScreen
              score={run.score}
              personalBest={run.personalBest}
              isNewBest={run.isNewBest}
              submitStatus={run.submitStatus}
              playerId={getOrCreatePlayerId()}
              entries={run.entries}
              entriesLoading={run.entriesLoading}
              playerName={run.playerName}
              onProvideName={handleProvideName}
              onPlayAgain={() => {
                setRun(emptyRun);
                setScreen('select');
              }}
              onBackToInvite={() => {
                setRun(emptyRun);
                setScreen('invite');
              }}
            />
          </motion.div>
        )}
        {screen === 'firstPlace' && (
          <motion.div key="firstPlace" {...fade}>
            <FirstPlaceScreen
              score={run.score}
              onContinue={() => setScreen('gameOver')}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

Note: `<StaticInvite />` is gone. `import { StaticInvite } from './components/StaticInvite';` is gone.

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: **PASS**. This is the point where the compile-break introduced in Task 1.3 heals.

- [ ] **Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "Rewrite App.tsx for leaderboard orchestration

Post-game callback submits when score beats local PB, routes to
firstPlace screen when the client becomes rank 1 after submit,
and falls through to gameOver otherwise. Name prompt is shown
inside gameOver the first qualifying run."
```

### Task 7.3: Delete dead files

**Files:**
- Delete: `src/screens/CardScreen.tsx`
- Delete: `src/screens/WonScreen.tsx`
- Delete: `src/components/TradingCard.tsx`
- Delete: `src/components/StaticInvite.tsx`
- Delete: `src/lib/downloadCard.ts`

- [ ] **Step 1: Verify nothing still imports these**

Run (each should return zero results):
```bash
npx grep -rn "CardScreen\|WonScreen\|TradingCard\|StaticInvite\|downloadCard\|downloadElement" src
```
If any match is found, trace and fix before deleting.

- [ ] **Step 2: Delete the files**

```bash
rm src/screens/CardScreen.tsx
rm src/screens/WonScreen.tsx
rm src/components/TradingCard.tsx
rm src/components/StaticInvite.tsx
rm src/lib/downloadCard.ts
```

- [ ] **Step 3: Typecheck + build**

Run:
```bash
npm run typecheck
npm run build
```
Both expected to PASS.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "Delete card/trading-card/static-invite modules

The card reveal concept is fully replaced by the leaderboard flow.
html2canvas and its only consumer are gone."
```

---

## Chunk 8: Verification + live AWS bring-up

Final integration check. This is the chunk that proves the feature actually works. No code changes (unless verification uncovers a bug).

### Task 8.1: Unit test suite

- [ ] **Step 1: Run all tests**

Run: `npm test`
Expected: all tests pass (identity, submit-score.validate, leaderboardApi).

### Task 8.2: Local preview with mocked fetches

The functions won't run under `vite dev` — Netlify CLI would be needed. For a fast sanity check without the live backend, stub `fetch` in the dev build so the UI renders end-to-end.

- [ ] **Step 1: Start the preview server**

Use the `preview_start` tool to boot the dev server against this worktree.

- [ ] **Step 2: In the browser, confirm the invite screen renders with the new "View Leaderboard" link**

Use `preview_snapshot` to inspect. The subtitle should read "flap your way onto the leaderboard".

- [ ] **Step 3: Play through and end the run**

Because `fetchLeaderboard`/`submitScore` will hit 404s (functions don't exist locally), confirm the UI gracefully:
- `GameOverScreen` renders with empty leaderboard ("no scores yet — be the first goat.").
- Name prompt appears on first qualifying run.
- Submitting the name shows `submitStatus.kind === 'network-error'` toast.
- No unhandled exceptions in `preview_console_logs`.

- [ ] **Step 4: Verify leaderboard screen is reachable from invite**

Click "View Leaderboard →" and confirm the standalone screen loads with "no scores yet — be the first goat."

### Task 8.3: Run the AWS setup (manual, one-time)

This is the human-in-the-loop step. Before merging this branch:

- [ ] **Step 1: Complete the 4 steps in [docs/aws-setup.md](../../aws-setup.md).**

Create the DynamoDB table, create the IAM user + policy, add the 4 environment variables in Netlify. This requires AWS Console access and cannot be automated here.

### Task 8.4: Deploy preview + smoke test

- [ ] **Step 1: Push the branch**

```bash
git push -u origin claude/busy-stonebraker-a217f1
```

- [ ] **Step 2: Open Netlify's deploy preview URL** and repeat the play-through:

1. Open `https://<preview>.netlify.app/.netlify/functions/get-leaderboard` in a new tab → expect `{"entries":[]}`.
2. Play one run, clear ≥3 pipes, enter a name, submit.
3. Observe the `firstPlace` screen (you're the only entry).
4. Click Continue; observe the leaderboard shows your row highlighted.
5. Refresh the preview; open View Leaderboard; your row is still there.
6. In AWS Console → DynamoDB → Explore items, confirm the row exists with the expected `playerId`, `name`, `score`, `character`, `updatedAt`.

### Task 8.5: Open the PR

- [ ] **Step 1: Open PR against `main`**

```bash
gh pr create --title "Replace card reveal with high-score leaderboard" --body "$(cat <<'EOF'
## Summary
- Converts Flappy Bakra to endless mode; scores ≥3 are submitted to a DynamoDB-backed global leaderboard.
- Adds two Netlify Functions (`get-leaderboard`, `submit-score`) that talk to DynamoDB via the AWS SDK v3 default credential chain.
- Deletes the card/trading-card/static-invite concept and `html2canvas`.
- Adds a #1-celebration screen that appears after a player's submit puts them at rank 1.

## Test plan
- [ ] `npm test` passes (identity + validation + API client).
- [ ] `npm run build` clean.
- [ ] Manual play-through on deploy preview: low-score path, first-qualifying-run name prompt, beat-local-PB submit, #1 celebration, refresh-and-persist.
- [ ] `docs/aws-setup.md` executed end-to-end in AWS + Netlify.

Spec: `docs/superpowers/specs/2026-04-19-high-score-leaderboard-design.md`
EOF
)"
```

---

## Done Criteria

- All tests pass.
- Deploy preview shows: endless mode, name prompt on first qualifying run, leaderboard populates, #1 celebration on first rank-1 submit, leaderboard persists across refreshes and devices.
- DynamoDB row inspected and matches expected shape.
- Old `WonScreen` / `CardScreen` / trading-card / static-invite code and `html2canvas` are gone.
