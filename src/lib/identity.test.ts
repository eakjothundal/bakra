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
