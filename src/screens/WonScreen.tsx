import { useMemo } from 'react';
import { DividerFancy, RaysBurst, StarBadge } from '../components/Ornaments';

const EMOJIS = ['🐐', '⭐', '✨', '🎉', '💜', '🔥'];

function makeConfetti(n: number) {
  return Array.from({ length: n }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
    delay: Math.random() * 2,
    duration: 2.5 + Math.random() * 2,
  }));
}

export function WonScreen({ onContinue }: { onContinue: () => void }) {
  const pieces = useMemo(() => makeConfetti(44), []);

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

      {/* Medal with rays */}
      <div className="relative w-[260px] h-[260px] flex items-center justify-center">
        <div className="absolute inset-0 overflow-hidden rounded-full">
          <RaysBurst
            className="absolute inset-[-15%] motion-safe:animate-[rays-pulse_6s_ease-in-out_infinite]"
            color="#D4A017"
            count={24}
            style={{ opacity: 0.6 }}
          />
        </div>
        <div
          className="relative w-[170px] h-[170px] rounded-full flex items-center justify-center motion-safe:animate-pop-in"
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
          <span className="text-[100px] leading-none relative z-10" aria-hidden>
            🐐
          </span>
          <StarBadge size={40} className="absolute -top-3 -left-3 drop-shadow-lg" />
          <StarBadge size={34} className="absolute -bottom-2 -right-3 drop-shadow-lg" />
        </div>
      </div>

      <div className="mt-4 text-[10px] tracking-[0.45em] text-brass font-black uppercase">
        ★ Verified Goat ★
      </div>

      <h2
        className="mt-3 display-headline"
        style={{ fontSize: 'clamp(44px, 12vw, 54px)' }}
      >
        YOU
        <br />
        SURVIVED
      </h2>

      <div className="mt-5 w-full max-w-[320px]">
        <DividerFancy label="THE GOATS HAVE SPOKEN" />
      </div>

      <p className="mt-5 max-w-[280px] text-center text-[14px] text-parchment/80 leading-[1.6]">
        your official <span className="text-brass font-bold">rookie card</span> is
        ready. trade wisely.
      </p>

      <button
        type="button"
        onClick={onContinue}
        className="btn-western mt-9 max-w-[320px]"
      >
        Claim My Card
      </button>
    </div>
  );
}
