import { describe, it, expect, afterEach, vi } from 'vitest';
import { fetchLeaderboard, submitScore } from './leaderboardApi';

describe('leaderboardApi', () => {
  afterEach(() => vi.restoreAllMocks());

  describe('fetchLeaderboard', () => {
    it('returns entries on success', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            entries: [
              { playerId: 'a', name: 'A', character: 'eakjot', score: 5, updatedAt: 1 },
            ],
          }),
          { status: 200 },
        ),
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
    const payload = {
      playerId: '550e8400-e29b-41d4-a716-446655440000',
      name: 'A',
      character: 'eakjot' as const,
      score: 4,
    };

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
