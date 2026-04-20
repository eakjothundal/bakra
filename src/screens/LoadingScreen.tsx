import { useEffect, useRef, useState } from 'react';
import { DividerFancy, RaysBurst } from '../components/Ornaments';

const MESSAGES = [
  'Slaughtering the bakra',
  'Marinating the vibes',
  'Chilling the tequila',
  "Pouring Chachu Ji's Desi",
];

export function LoadingScreen({
  onComplete,
  slow = false,
}: {
  onComplete: () => void;
  slow?: boolean;
}) {
  const [progress, setProgress] = useState(0);
  const firedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const BASE_DURATION = 4500;
    const DURATION = slow ? Math.round(BASE_DURATION * 1.5) : BASE_DURATION;
    const TICK = 80;
    const start = performance.now();
    const id = window.setInterval(() => {
      const elapsed = performance.now() - start;
      const pct = Math.min(100, (elapsed / DURATION) * 100);
      setProgress(pct);
      if (pct >= 100) {
        window.clearInterval(id);
        if (firedRef.current) return;
        firedRef.current = true;
        window.setTimeout(() => onCompleteRef.current(), 600);
      }
    }, TICK);
    return () => window.clearInterval(id);
  }, [slow]);

  const msgIndex = Math.min(
    MESSAGES.length - 1,
    Math.floor((progress / 100) * MESSAGES.length),
  );

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-8 text-parchment">
      <div className="relative w-[220px] h-[220px] flex items-center justify-center">
        <div className="absolute inset-0 overflow-hidden rounded-full">
          <RaysBurst
            className="absolute inset-[-10%] motion-safe:animate-[rays-pulse_6s_ease-in-out_infinite]"
            color="#D4A017"
            count={20}
            style={{ opacity: 0.4 }}
          />
        </div>
        <div
          className="relative w-[150px] h-[150px] rounded-full flex items-center justify-center motion-safe:animate-goat-bounce"
          style={{
            background:
              'radial-gradient(circle at 40% 30%, #f1c238 0%, #D4A017 60%, #8b6a0f 100%)',
            border: '4px solid #8b3a1f',
            boxShadow:
              '0 10px 25px rgba(0,0,0,0.5), inset 0 2px 0 rgba(255,255,255,0.35)',
          }}
        >
          <span className="text-[96px] leading-none select-none" aria-hidden>
            🐐
          </span>
        </div>
      </div>

      <div className="mt-8 text-center text-[11px] tracking-[0.45em] uppercase text-brass font-black">
        ★ Bakra Party 2026 ★
      </div>

      <div className="mt-4 w-full max-w-[280px]">
        <DividerFancy />
      </div>

      <div className="mt-4 text-[12px] uppercase tracking-[0.22em] text-parchment text-center min-h-[20px] font-medium">
        {MESSAGES[msgIndex]}…
      </div>

      <div
        className="mt-4 w-full max-w-[260px] h-[10px] rounded-full overflow-hidden"
        style={{
          background: 'rgba(244,232,208,0.08)',
          border: '1px solid rgba(212,160,23,0.25)',
          boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.4)',
        }}
      >
        <div
          className="h-full"
          style={{
            width: `${progress}%`,
            background:
              'linear-gradient(90deg, #8b6a0f 0%, #D4A017 45%, #f1c238 100%)',
            transition: 'width 80ms linear',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.35)',
          }}
        />
      </div>
      <div className="mt-2 text-[11px] text-brass/70 tabular font-mono">
        {Math.floor(progress)}%
      </div>
    </div>
  );
}
