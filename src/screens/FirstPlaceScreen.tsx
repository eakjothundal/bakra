import { useMemo } from 'react';
import { DividerFancy, RaysBurst, StarBadge } from '../components/Ornaments';

const EMOJIS = ['🐐', '⭐', '✨', '🎉', '🏆', '🔥'];

function makeConfetti(n: number) {
  return Array.from({ length: n }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
    delay: Math.random() * 2,
    duration: 2.5 + Math.random() * 2,
  }));
}

interface Props {
  score: number;
  onContinue: () => void;
}

export function FirstPlaceScreen({ score, onContinue }: Props) {
  const pieces = useMemo(() => makeConfetti(60), []);

  return (
    <div className="relative min-h-dvh w-full max-w-app mx-auto px-6 pt-10 pb-10 flex flex-col items-center justify-center overflow-hidden text-center">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="confetti-piece"
          style={
            {
              left: `${p.left}%`,
              ['--delay' as string]: `${p.delay}s`,
              ['--dur' as string]: `${p.duration}s`,
            } as React.CSSProperties
          }
          aria-hidden
        >
          {p.emoji}
        </span>
      ))}

      <div className="relative w-[280px] h-[280px] flex items-center justify-center">
        <div className="absolute inset-0 overflow-hidden rounded-full">
          <RaysBurst
            className="absolute inset-[-20%] motion-safe:animate-[rays-pulse_5s_ease-in-out_infinite]"
            color="#D4A017"
            count={32}
            style={{ opacity: 0.75 }}
          />
        </div>
        <div
          className="relative w-[190px] h-[190px] rounded-full flex items-center justify-center motion-safe:animate-pop-in"
          style={{
            background:
              'radial-gradient(circle at 40% 30%, #f1c238 0%, #D4A017 60%, #8b6a0f 100%)',
            border: '5px solid #8b3a1f',
            boxShadow:
              '0 14px 30px rgba(0,0,0,0.6), inset 0 3px 0 rgba(255,255,255,0.4), inset 0 -3px 0 rgba(0,0,0,0.2)',
          }}
        >
          <div
            className="absolute inset-3 rounded-full border-2 border-dashed"
            style={{ borderColor: 'rgba(139,58,31,0.5)' }}
          />
          <span className="text-[110px] leading-none relative z-10" aria-hidden>
            🏆
          </span>
          <StarBadge size={44} className="absolute -top-3 -left-3 drop-shadow-lg" />
          <StarBadge size={38} className="absolute -bottom-2 -right-3 drop-shadow-lg" />
        </div>
      </div>

      <div className="mt-4 text-[10px] tracking-[0.45em] text-brass font-black uppercase">
        ★ Top of the Herd ★
      </div>

      <h2
        className="mt-3 display-headline"
        style={{ fontSize: 'clamp(40px, 11vw, 52px)' }}
      >
        NEW #1
        <br />
        GOAT
      </h2>

      <div className="mt-4 font-mono font-black text-[32px] text-brass tabular">
        {score}
      </div>

      <div className="mt-5 w-full max-w-[320px]">
        <DividerFancy label="THE LEGEND GROWS" />
      </div>

      <button type="button" onClick={onContinue} className="btn-western mt-9 max-w-[320px]">
        Continue
      </button>
    </div>
  );
}
