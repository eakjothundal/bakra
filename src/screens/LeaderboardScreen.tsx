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
