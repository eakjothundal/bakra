import { describe, it, expect } from 'vitest';
import { validateSubmit } from './functions/submit-score-validate';

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
