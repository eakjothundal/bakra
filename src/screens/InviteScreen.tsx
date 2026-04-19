import { useRef, type PointerEvent } from 'react';
import { GoatRainLayer, useGoatRain } from '../components/GoatRain';
import type { UseSound } from '../hooks/useSound';
import {
  CornerBracket,
  DividerFancy,
  Fleur,
  HorseShoe,
  RaysBurst,
  SparkleStar,
  StarBadge,
} from '../components/Ornaments';

interface Props {
  onStart: () => void;
  sound: UseSound;
}

export function InviteScreen({ onStart, sound }: Props) {
  const { drops, spawn } = useGoatRain();
  const rootRef = useRef<HTMLDivElement>(null);

  const handleTap = (e: PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('[data-no-rain]')) return;
    const rect = rootRef.current?.getBoundingClientRect();
    if (!rect) return;
    spawn(e.clientX - rect.left, e.clientY - rect.top);
  };

  const handleCTA = () => {
    void sound.unlock();
    sound.play('tap');
    onStart();
  };

  return (
    <div
      ref={rootRef}
      onPointerDown={handleTap}
      className="relative min-h-dvh w-full max-w-app mx-auto px-5 pt-6 pb-8 overflow-hidden"
    >
      <GoatRainLayer drops={drops} />

      {/* Background star scatter */}
      <span className="star-scatter top-20 left-4 text-xl motion-safe:animate-twinkle" style={{ animationDelay: '0s' }}>✦</span>
      <span className="star-scatter top-40 right-6 text-base motion-safe:animate-twinkle" style={{ animationDelay: '0.7s' }}>✦</span>
      <span className="star-scatter top-80 left-8 text-lg motion-safe:animate-twinkle" style={{ animationDelay: '1.4s' }}>✦</span>
      <span className="star-scatter bottom-40 right-4 text-xl motion-safe:animate-twinkle" style={{ animationDelay: '0.3s' }}>✦</span>
      <span className="star-scatter bottom-24 left-10 text-sm motion-safe:animate-twinkle" style={{ animationDelay: '1.1s' }}>✦</span>
      <span className="star-scatter" style={{ top: '32%', left: '3%', fontSize: 15, animationDelay: '0.5s' }} aria-hidden>✦</span>
      <span className="star-scatter motion-safe:animate-twinkle" style={{ top: '26%', right: '4%', fontSize: 11, animationDelay: '1.8s' }} aria-hidden>✦</span>
      <span className="star-scatter motion-safe:animate-twinkle" style={{ top: '52%', left: '5%', fontSize: 13, animationDelay: '0.9s' }} aria-hidden>✦</span>
      <span className="star-scatter motion-safe:animate-twinkle" style={{ top: '60%', right: '3%', fontSize: 10, animationDelay: '2.2s' }} aria-hidden>✦</span>

      {/* Outer wanted-poster frame */}
      <div
        data-no-rain
        className="relative parchment-panel px-4 pt-5 pb-6"
      >
        {/* Corner brackets */}
        <CornerBracket className="absolute -top-2 -left-2" />
        <CornerBracket
          className="absolute -top-2 -right-2"
          style={{ transform: 'scaleX(-1)' }}
        />
        <CornerBracket
          className="absolute -bottom-2 -left-2"
          style={{ transform: 'scaleY(-1)' }}
        />
        <CornerBracket
          className="absolute -bottom-2 -right-2"
          style={{ transform: 'scale(-1,-1)' }}
        />

        {/* Top banner */}
        <div className="flex items-center justify-center gap-3 text-brass">
          <HorseShoe size={22} />
          <div className="text-[10px] tracking-[0.42em] uppercase font-bold">
            Summons to the
          </div>
          <HorseShoe size={22} style={{ transform: 'scaleX(-1)' }} />
        </div>

        {/* Main title */}
        <h1
          className="display-headline text-center mt-3"
          style={{ fontSize: 'clamp(50px, 13vw, 64px)' }}
        >
          BAKRA
          <br />
          PARTY
        </h1>

        {/* Subtitle with fleur */}
        <div className="mt-2 flex items-center justify-center gap-2 text-brass/80">
          <Fleur size={14} />
          <span className="text-[11px] tracking-[0.3em] uppercase font-bold">
            A Goated Occasion
          </span>
          <Fleur size={14} />
        </div>

        {/* Hero — Eakjot + Bakra */}
        <div className="mt-4 relative h-[340px] flex items-center justify-center">
          {/* Radiating rays background */}
          <div className="absolute inset-0 overflow-hidden flex items-center justify-center">
            <div className="relative w-[360px] h-[360px]">
              <RaysBurst
                className="absolute inset-0 motion-safe:animate-[rays-pulse_6s_ease-in-out_infinite]"
                color="#D4A017"
                count={28}
                style={{ opacity: 0.6 }}
              />
            </div>
          </div>

          {/* Golden sun-disc glow behind subject */}
          <div
            aria-hidden
            className="absolute motion-safe:animate-glow-aura pointer-events-none"
            style={{
              width: 220,
              height: 220,
              top: 30,
              borderRadius: '50%',
              background:
                'radial-gradient(circle at 50% 45%, rgba(245,208,96,0.55) 0%, rgba(212,160,23,0.35) 35%, rgba(212,160,23,0) 70%)',
              filter: 'blur(2px)',
            }}
          />

          {/* Spinning circular text ring (sits around upper body) */}
          <svg
            aria-hidden
            className="absolute pointer-events-none motion-safe:animate-spin-slow"
            style={{ width: 260, height: 260, top: 10 }}
            viewBox="0 0 260 260"
          >
            <defs>
              <path id="invite-ring-path" d="M130,130 m-112,0 a112,112 0 1,1 224,0 a112,112 0 1,1 -224,0" />
            </defs>
            <circle cx="130" cy="130" r="112" fill="none" stroke="#D4A017" strokeWidth="1" strokeDasharray="4 7" opacity=".45" />
            <text fontSize="9" fontFamily="Rye, serif" letterSpacing="4" fill="#D4A017" fontWeight="700">
              <textPath href="#invite-ring-path">★ BAKRA PARTY 2026 ★ LINCOLN CA ★ MAY 19 ★</textPath>
            </text>
          </svg>

          {/* Counter-rotating inner dashed ring */}
          <div
            aria-hidden
            className="absolute rounded-full border border-dashed pointer-events-none motion-safe:animate-spin-slow-r"
            style={{ width: 232, height: 232, top: 24, borderColor: 'rgba(212,160,23,0.3)' }}
          />

          {/* The hero illustration */}
          <div className="relative medallion-float" style={{ zIndex: 2 }}>
            <img
              src={`${import.meta.env.BASE_URL}hero-eakjot.png`}
              alt="Eakjot, the groom, holding a whiskey and his goat"
              draggable={false}
              style={{
                width: 230,
                height: 'auto',
                display: 'block',
                filter:
                  'drop-shadow(0 0 18px rgba(212,160,23,0.35)) drop-shadow(0 14px 22px rgba(0,0,0,0.65))',
                userSelect: 'none',
              }}
            />
          </div>

          {/* Orbiting star badges */}
          <StarBadge
            size={44}
            className="absolute motion-safe:animate-spin4s"
            style={{ top: 20, left: 6, animationDuration: '8s', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.45))', zIndex: 3 }}
          />
          <StarBadge
            size={36}
            className="absolute motion-safe:animate-spin4s"
            style={{ top: 60, right: 4, animationDuration: '10s', animationDirection: 'reverse', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.45))', zIndex: 3 }}
          />
          <StarBadge
            size={30}
            className="absolute motion-safe:animate-spin4s"
            style={{ bottom: 28, left: 10, animationDuration: '12s', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.45))', zIndex: 3 }}
          />

          {/* Cardinal sparkle stars around the hero */}
          <SparkleStar size={18} className="absolute motion-safe:animate-twinkle" style={{ top: 40, left: '48%', animationDelay: '0.2s', zIndex: 3 }} />
          <SparkleStar size={14} className="absolute motion-safe:animate-twinkle" style={{ top: 130, right: 28, animationDelay: '0.9s', zIndex: 3 }} />
          <SparkleStar size={16} className="absolute motion-safe:animate-twinkle" style={{ bottom: 50, right: 18, animationDelay: '1.4s', zIndex: 3 }} />
          <SparkleStar size={12} className="absolute motion-safe:animate-twinkle" style={{ bottom: 80, left: 32, animationDelay: '0.5s', zIndex: 3 }} />
        </div>

        {/* Divider */}
        <div className="mt-3">
          <DividerFancy label="THE DETAILS" />
        </div>

        {/* Details card — ticket-stub style */}
        <div className="mt-3 space-y-0">
          <DetailRow label="WHEN" value="Tue · May 19, 2026 · 6 PM ONWARDS" />
          <DashedDivider />
          <DetailRow
            label="WHERE"
            value="2177 Donovan Dr, Lincoln CA 95648"
            href="https://maps.google.com/?q=2177+Donovan+Dr+Lincoln+CA+95648"
          />
          <DashedDivider />
          <DetailRow label="FIT" value="Wear your GOAT's jersey. Any sport." />
        </div>

        {/* Divider */}
        <div className="mt-4">
          <DividerFancy />
        </div>

        {/* CTA */}
        <div className="mt-4">
          <div className="text-center text-[10px] uppercase tracking-[0.3em] text-parchment/75 mb-3">
            · think you're worthy? ·
          </div>
          <button type="button" onClick={handleCTA} className="btn-western">
            Play Flappy Bakra
          </button>
        </div>

        {/* Footer hint */}
        <div className="mt-4 text-center text-[10px] text-parchment/65 tracking-[0.18em] uppercase">
          tap around for goat rain · pass 3 pipes to unlock your card
        </div>
      </div>

      {/* Bottom ornament */}
      <div className="mt-4 flex items-center justify-center gap-4 text-brass/60">
        <HorseShoe size={18} />
        <span className="font-display text-[11px] tracking-[0.25em]">
          EST. 2026
        </span>
        <HorseShoe size={18} style={{ transform: 'scaleX(-1)' }} />
      </div>
    </div>
  );
}

function DashedDivider() {
  return (
    <div
      className="h-px border-t border-dashed my-3"
      style={{ borderColor: 'rgba(212, 160, 23, 0.25)' }}
    />
  );
}

function DetailRow({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href?: string;
}) {
  const content = (
    <div className="flex items-start gap-4 py-2 min-h-[44px]">
      <div className="flex flex-col items-center min-w-[52px] pt-[3px]">
        <div className="text-brass text-[9px] tracking-[0.28em] font-black">
          {label}
        </div>
        <div className="w-6 h-px bg-brass/50 mt-[3px]" />
      </div>
      <div className="text-[13.5px] leading-[1.45] text-parchment flex-1 font-medium">
        {value}
      </div>
    </div>
  );
  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${label.toLowerCase()}: ${value} — opens in Google Maps`}
        className="block active:opacity-70 active:scale-[0.99] transition-transform rounded-md"
      >
        {content}
      </a>
    );
  }
  return content;
}
