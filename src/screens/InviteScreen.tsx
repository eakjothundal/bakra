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
      className="relative min-h-dvh w-full max-w-app mx-auto px-5 pt-8 pb-10 overflow-hidden"
    >
      <GoatRainLayer drops={drops} />

      {/* Background star scatter */}
      <span className="star-scatter top-20 left-4 text-xl">✦</span>
      <span className="star-scatter top-40 right-6 text-base opacity-60">✦</span>
      <span className="star-scatter top-80 left-8 text-lg opacity-40">✦</span>
      <span className="star-scatter bottom-40 right-4 text-xl">✦</span>
      <span className="star-scatter bottom-24 left-10 text-sm">✦</span>

      {/* Outer wanted-poster frame */}
      <div
        data-no-rain
        className="relative parchment-panel px-4 pt-6 pb-7"
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
          className="display-headline text-center mt-4"
          style={{ fontSize: 'clamp(54px, 14vw, 68px)' }}
        >
          BAKRA
          <br />
          PARTY
        </h1>

        {/* Subtitle with fleur */}
        <div className="mt-3 flex items-center justify-center gap-2 text-brass/80">
          <Fleur size={14} />
          <span className="text-[11px] tracking-[0.3em] uppercase font-bold">
            A Goated Occasion
          </span>
          <Fleur size={14} />
        </div>

        {/* Medallion with radiating rays + star orbit */}
        <div className="mt-6 relative h-[240px] flex items-center justify-center">
          <div className="absolute inset-0 overflow-hidden rounded-[80px] flex items-center justify-center">
            <div className="relative w-[340px] h-[340px]">
              <RaysBurst
                className="absolute inset-0 motion-safe:animate-[rays-pulse_6s_ease-in-out_infinite]"
                color="#D4A017"
                count={24}
                style={{ opacity: 0.55 }}
              />
            </div>
          </div>
          <div className="relative medallion-float">
            <div
              className="relative w-[180px] h-[180px] rounded-full flex items-center justify-center"
              style={{
                background: 'radial-gradient(circle at 40% 35%, #f1c238 0%, #D4A017 55%, #8b6a0f 100%)',
                border: '5px solid #8b3a1f',
                boxShadow:
                  '0 10px 30px rgba(0,0,0,0.55), inset 0 2px 0 rgba(255,255,255,0.35), inset 0 -4px 0 rgba(0,0,0,0.18)',
              }}
            >
              {/* Inner dashed ring */}
              <div
                className="absolute inset-3 rounded-full border-2 border-dashed"
                style={{ borderColor: 'rgba(139,58,31,0.45)' }}
              />
              <span className="text-[120px] leading-none select-none relative z-10 drop-shadow-lg" aria-hidden>
                🐐
              </span>
              {/* 4 tiny stars at cardinal points */}
              <SparkleStar size={14} className="absolute top-[6px] left-1/2 -translate-x-1/2" />
              <SparkleStar size={14} className="absolute bottom-[6px] left-1/2 -translate-x-1/2" />
              <SparkleStar size={14} className="absolute left-[6px] top-1/2 -translate-y-1/2" />
              <SparkleStar size={14} className="absolute right-[6px] top-1/2 -translate-y-1/2" />
            </div>

            {/* Big star badges orbiting */}
            <StarBadge
              size={44}
              className="absolute -top-3 -left-4 motion-safe:animate-spin4s"
              style={{ animationDuration: '8s' }}
            />
            <StarBadge
              size={38}
              className="absolute -bottom-2 -right-5 motion-safe:animate-spin4s"
              style={{ animationDuration: '10s', animationDirection: 'reverse' }}
            />
          </div>
        </div>

        {/* Divider */}
        <div className="mt-5">
          <DividerFancy label="THE DETAILS" />
        </div>

        {/* Details card — ticket-stub style */}
        <div className="mt-5 space-y-0">
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
        <div className="mt-6">
          <DividerFancy />
        </div>

        {/* CTA */}
        <div className="mt-5">
          <div className="text-center text-[10px] uppercase tracking-[0.3em] text-parchment/75 mb-3">
            · think you're worthy? ·
          </div>
          <button type="button" onClick={handleCTA} className="btn-western">
            Play Flappy Bakra
          </button>
        </div>

        {/* Footer hint */}
        <div className="mt-5 text-center text-[10px] text-parchment/65 tracking-[0.18em] uppercase">
          tap around for goat rain · pass 3 pipes to unlock your card
        </div>
      </div>

      {/* Bottom ornament */}
      <div className="mt-6 flex items-center justify-center gap-4 text-brass/60">
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
