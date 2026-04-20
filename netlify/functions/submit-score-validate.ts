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
