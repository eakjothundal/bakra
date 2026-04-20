import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchLeaderboard } from '../lib/leaderboardApi';
import type { LeaderboardEntry } from '../types';

interface Options {
  initialEntries?: LeaderboardEntry[];
  skipInitialFetch?: boolean;
}

interface Result {
  entries: LeaderboardEntry[];
  loading: boolean;
  refetch: () => Promise<void>;
}

export function useLeaderboard(opts: Options = {}): Result {
  const [entries, setEntries] = useState<LeaderboardEntry[]>(opts.initialEntries ?? []);
  const [loading, setLoading] = useState(!opts.skipInitialFetch);
  const aborted = useRef(false);

  const refetch = useCallback(async () => {
    setLoading(true);
    const rows = await fetchLeaderboard();
    if (aborted.current) return;
    setEntries(rows);
    setLoading(false);
  }, []);

  useEffect(() => {
    aborted.current = false;
    if (!opts.skipInitialFetch) void refetch();
    return () => {
      aborted.current = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { entries, loading, refetch };
}
