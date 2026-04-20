import type { LeaderboardEntry } from '../types';
import { Leaderboard } from '../components/Leaderboard';
import { NamePromptModal } from '../components/NamePromptModal';

export type SubmitStatus =
  | { kind: 'noop' }
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
