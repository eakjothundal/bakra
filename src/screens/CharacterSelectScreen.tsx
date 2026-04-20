import { useState } from 'react';
import { CHARACTER_ORDER, CHARACTERS } from '../game/characters';
import type { Character } from '../types';
import type { UseSound } from '../hooks/useSound';
import {
  DividerFancy,
  SparkleStar,
  StarBadge,
} from '../components/Ornaments';

interface Props {
  onBack: () => void;
  onConfirm: (c: Character) => void;
  sound: UseSound;
}

const RARITY: Record<Character, { label: string; stars: number; hue: string }> = {
  eakjot: { label: 'LEGENDARY', stars: 5, hue: '#D4A017' },
  abel: { label: 'EPIC', stars: 4, hue: '#c54b2a' },
  astro: { label: 'EPIC', stars: 4, hue: '#e6b83a' },
};

const PORTRAIT_SCALE: Record<Character, number> = {
  eakjot: 1.3,
  abel: 1.5,
  astro: 1.5,
};

export function CharacterSelectScreen({ onBack, onConfirm, sound }: Props) {
  const [selected, setSelected] = useState<Character | null>(null);

  const handleSelect = (c: Character) => {
    sound.play('tap');
    setSelected(c);
  };

  const handleStart = () => {
    if (!selected) return;
    sound.play('tap');
    onConfirm(selected);
  };

  return (
    <div className="min-h-dvh w-full max-w-app mx-auto px-5 pt-8 pb-8 flex flex-col">
      <button
        type="button"
        onClick={onBack}
        aria-label="Back to invite"
        className="self-start text-[11px] uppercase tracking-[0.28em] text-parchment/80 hover:text-parchment font-bold inline-flex items-center gap-2 min-h-[44px] px-3 -ml-3 rounded-lg active:bg-parchment/5"
      >
        <span aria-hidden>←</span> back
      </button>

      <div className="mt-2 text-center">
        <div className="text-[10px] tracking-[0.4em] text-brass font-bold uppercase">
          ◈ Roster Lockup ◈
        </div>
        <h2
          className="mt-3 display-headline"
          style={{ fontSize: 'clamp(34px, 9vw, 44px)' }}
        >
          CHOOSE
          <br />
          YOUR GOAT
        </h2>
        <div className="mt-3">
          <DividerFancy label="EACH RIDES DIFFERENTLY" />
        </div>
      </div>

      <div className="mt-6 space-y-3 flex-1">
        {CHARACTER_ORDER.map((key) => {
          const c = CHARACTERS[key];
          const r = RARITY[key];
          const isSel = selected === key;
          const isDim = selected !== null && !isSel;
          return (
            <button
              key={key}
              type="button"
              onClick={() => handleSelect(key)}
              aria-pressed={isSel}
              aria-label={`Choose ${c.name} — ${c.descriptor}`}
              className={[
                'relative w-full rounded-[18px] border-2 px-4 py-4 flex items-center gap-4 text-left transition-all overflow-hidden min-h-[92px] active:scale-[0.98]',
                isSel
                  ? 'border-brass shadow-[0_0_0_4px_rgba(212,160,23,0.15),0_10px_30px_rgba(212,160,23,0.25)]'
                  : 'border-parchment/20 shadow-[0_6px_14px_rgba(0,0,0,0.35)]',
                isDim ? 'opacity-55' : '',
              ].join(' ')}
              style={{
                background: isSel
                  ? 'linear-gradient(135deg, rgba(212,160,23,0.22) 0%, rgba(139,58,31,0.25) 100%)'
                  : 'linear-gradient(135deg, rgba(244,232,208,0.04) 0%, rgba(139,58,31,0.08) 100%)',
              }}
            >
              {/* Rarity corner ribbon */}
              <div
                className="absolute top-0 right-0 px-3 py-[3px] text-[8px] font-black tracking-[0.2em] uppercase text-bg"
                style={{
                  background: r.hue,
                  clipPath: 'polygon(0 0, 100% 0, 100% 100%, 14% 100%)',
                  paddingLeft: 18,
                }}
              >
                {r.label}
              </div>

              {/* Portrait */}
              <div
                className="relative w-[104px] h-[104px] rounded-2xl flex items-center justify-center shrink-0 border-[2.5px] overflow-hidden"
                style={{
                  background:
                    'radial-gradient(circle at 35% 25%, #f1c238 0%, #D4A017 55%, #8b6a0f 100%)',
                  borderColor: '#8b3a1f',
                  boxShadow:
                    'inset 0 2px 0 rgba(255,255,255,0.3), inset 0 -2px 0 rgba(0,0,0,0.18), 0 4px 10px rgba(0,0,0,0.3)',
                }}
              >
                <img
                  src={c.sprite}
                  alt=""
                  aria-hidden
                  className="w-full h-full object-contain"
                  style={{ imageRendering: 'pixelated', transform: `scale(${PORTRAIT_SCALE[key]})` }}
                />
                <span className="sr-only">{c.emoji}</span>
                <SparkleStar
                  size={14}
                  className="absolute -top-2 -right-2"
                />
              </div>

              <div className="flex-1 min-w-0">
                <div
                  className="font-display text-[20px] text-parchment leading-none"
                  style={{ letterSpacing: '0.02em' }}
                >
                  {c.name}
                </div>
                <div className="mt-1.5 text-[12px] text-parchment/80 leading-snug">
                  {c.descriptor}
                </div>
                <div className="mt-2 flex items-center gap-[2px]">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span
                      key={i}
                      className="text-[10px]"
                      style={{ color: i < r.stars ? '#D4A017' : 'rgba(244,232,208,0.2)' }}
                      aria-hidden
                    >
                      ★
                    </span>
                  ))}
                  <span className="ml-2 text-[9px] tracking-[0.2em] uppercase text-parchment/70 font-bold">
                    {statLabel(c.physics)}
                  </span>
                </div>
              </div>

              {isSel && (
                <StarBadge size={28} className="shrink-0" />
              )}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={handleStart}
        disabled={!selected}
        className="btn-western mt-6"
      >
        {selected ? 'Saddle Up' : 'Pick a Goat'}
      </button>
    </div>
  );
}

function statLabel(physics: { gravity: number; flap: number }) {
  if (physics.gravity > 0.5) return 'HEAVY · PUNCHY';
  if (physics.gravity < 0.4) return 'FLOATY · LIGHT';
  return 'BALANCED · ICONIC';
}
