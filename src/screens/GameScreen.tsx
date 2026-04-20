import { useEffect, useState } from 'react';
import type { Character } from '../types';
import { FlappyBakra } from '../game/FlappyBakra';
import { trackEvent } from '../lib/tracking';
interface Props {
  character: Character;
  onBack: () => void;
  onGameEnd: (score: number) => void;
}

export function GameScreen({ character, onBack, onGameEnd }: Props) {
  const [score, setScore] = useState(0);

  useEffect(() => {
    trackEvent('game_started', { character });
  }, [character]);

  return (
    <div className="min-h-dvh w-full max-w-app mx-auto px-4 pt-10 pb-4 flex flex-col">
      <div className="flex items-center justify-between px-2">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to invite"
          className="text-[12px] uppercase tracking-[0.2em] text-parchment/80 inline-flex items-center gap-1 min-h-[44px] min-w-[44px] px-3 -ml-3 rounded-lg active:bg-parchment/5 font-bold"
        >
          ← back
        </button>
        <div className="text-center">
          <div className="font-mono font-black text-[32px] text-brass leading-none tabular">
            {score}
          </div>
        </div>
        <div className="w-[48px]" aria-hidden />
      </div>

      <div className="flex-1 flex items-center justify-center mt-4">
        <FlappyBakra
          character={character}
          onScore={setScore}
          onGameEnd={onGameEnd}
        />
      </div>
    </div>
  );
}
