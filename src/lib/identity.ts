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
