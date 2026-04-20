import type { Character, LeaderboardEntry } from '../types';

interface Props {
  entries: LeaderboardEntry[];
  highlightPlayerId?: string | null;
  loading?: boolean;
  maxVisible?: number;
  fill?: boolean;
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
  fill = false,
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
  const visibleClass = fill
    ? 'h-full'
    : entries.length > cap
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
