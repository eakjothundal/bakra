import { RaysBurst, SparkleStar, StarBadge } from './Ornaments';

interface Props {
  forDownload?: boolean;
  id?: string;
}

const STATS: Array<[string, string]> = [
  ['Tequila shots', '2,847'],
  ['Whiskey tolerance', '75'],
  ['Lakers hatred', '99'],
  ['Sobriety forecast', '12'],
];

export function TradingCard({ forDownload = false, id }: Props) {
  return (
    <div
      id={id}
      className={[
        'relative rounded-[22px] rust-hatch',
        forDownload ? '' : 'card-notch',
      ].join(' ')}
      style={{
        padding: 4,
        width: '100%',
        maxWidth: 340,
        margin: '0 auto',
        boxShadow: forDownload ? 'none' : '0 25px 50px rgba(0,0,0,0.55), 0 0 0 1px rgba(212,160,23,0.4)',
        border: '3px solid #D4A017',
      }}
    >
      {/* Inner dashed gold border */}
      <div
        className="relative rounded-[18px] p-4 overflow-hidden"
        style={{
          border: '2px dashed rgba(212, 160, 23, 0.55)',
        }}
      >
        {/* Holographic sheen overlay (only on-screen) */}
        {!forDownload && (
          <div
            className="absolute inset-0 pointer-events-none holo-sheen"
            style={{ borderRadius: 18 }}
          />
        )}

        {/* Star corners */}
        <SparkleStar size={14} className="absolute top-2 left-2" />
        <SparkleStar size={14} className="absolute top-2 right-2" />
        <SparkleStar size={14} className="absolute bottom-2 left-2" />
        <SparkleStar size={14} className="absolute bottom-2 right-2" />

        {/* Header plate */}
        <div className="relative text-center py-1">
          <div
            className="absolute top-1/2 left-0 right-0 h-px -translate-y-1/2"
            style={{
              background:
                'linear-gradient(90deg, transparent, rgba(212,160,23,0.6), transparent)',
            }}
          />
          <div className="relative inline-flex items-center gap-2 px-3 py-1 bg-bg/60 rounded-md border border-brass/50">
            <span className="text-brass text-[10px]">★</span>
            <span
              className="text-parchment font-black text-[10px] tracking-[0.35em] uppercase"
            >
              Rookie Card · 2026
            </span>
            <span className="text-brass text-[10px]">★</span>
          </div>
        </div>

        {/* Name & number */}
        <div className="mt-3 text-center">
          <div
            className="text-parchment font-display text-[30px] leading-none"
            style={{ letterSpacing: '0.06em', textShadow: '2px 2px 0 rgba(0,0,0,0.4)' }}
          >
            EAKJOT
          </div>
          <div
            className="mt-1 font-mono font-black text-brass text-[24px]"
            style={{ letterSpacing: '0.08em' }}
          >
            #22
          </div>
        </div>

        {/* Portrait with ray burst */}
        <div
          className="relative mt-3 rounded-2xl p-3 overflow-hidden"
          style={{
            background:
              'linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.2) 100%)',
            border: '1.5px solid rgba(212,160,23,0.4)',
          }}
        >
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <RaysBurst
              color="#D4A017"
              count={16}
              style={{ width: 260, height: 260, opacity: 0.25 }}
            />
          </div>
          <div className="relative flex items-center justify-center py-2">
            <div
              className="w-[90px] h-[90px] rounded-full flex items-center justify-center"
              style={{
                background:
                  'radial-gradient(circle at 40% 30%, #f1c238 0%, #D4A017 55%, #8b6a0f 100%)',
                border: '4px solid #8b3a1f',
                boxShadow:
                  'inset 0 2px 0 rgba(255,255,255,0.4), 0 6px 14px rgba(0,0,0,0.4)',
              }}
            >
              <span className="text-[60px] leading-none" aria-hidden>🐐</span>
            </div>
          </div>
        </div>

        {/* Metadata rows */}
        <div className="mt-3 space-y-1">
          <StatLine label="Position" value="GROOM" />
          <StatLine label="Team" value="HUNDALS" />
          <StatLine label="Season" value="2026" />
        </div>

        {/* Rookie banner */}
        <div className="mt-3 relative flex items-center justify-center">
          <div
            className="px-4 py-1.5 text-[10px] tracking-[0.3em] font-black uppercase text-bg"
            style={{
              background: 'linear-gradient(180deg, #f1c238, #D4A017)',
              border: '1.5px solid #8b3a1f',
              borderRadius: 6,
              boxShadow: '0 3px 0 rgba(0,0,0,0.3)',
            }}
          >
            ★ Rookie Groom ★
          </div>
        </div>

        {/* Career stats */}
        <div
          className="mt-4 pt-3 border-t border-dashed"
          style={{ borderColor: 'rgba(212, 160, 23, 0.4)' }}
        >
          <div
            className="text-center text-[9px] uppercase text-parchment/75 mb-2"
            style={{ letterSpacing: '0.3em' }}
          >
            ◈ Career Stats ◈
          </div>

          <div className="space-y-1.5">
            {STATS.map(([label, value]) => (
              <div key={label} className="flex items-center text-[11px] uppercase">
                <span className="text-parchment/85 whitespace-nowrap tracking-wider">
                  {label}
                </span>
                <span className="dotted-leader" />
                <span className="font-mono font-bold text-brass text-[14px] tabular">
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div
          className="mt-4 pt-3 border-t border-dashed flex items-center justify-between"
          style={{ borderColor: 'rgba(212, 160, 23, 0.4)' }}
        >
          <span
            className="text-[9px] text-parchment/75 uppercase tracking-[0.25em]"
          >
            May 19
          </span>
          <span
            className="text-[9px] text-parchment/75 uppercase tracking-[0.25em]"
          >
            Lincoln · CA
          </span>
          <span
            className="text-[9px] text-parchment/75 uppercase tracking-[0.25em]"
          >
            The Boys
          </span>
        </div>
      </div>

      {/* Rarity stamp in corner */}
      <div
        className="absolute -top-2 -right-2 w-14 h-14 rounded-full flex items-center justify-center rotate-12"
        style={{
          background: 'linear-gradient(135deg, #f1c238 0%, #D4A017 100%)',
          border: '3px solid #8b3a1f',
          boxShadow: '0 6px 14px rgba(0,0,0,0.4)',
        }}
      >
        <div className="text-bg text-center leading-[1]">
          <div className="text-[7px] font-black tracking-wider">1 / 1</div>
          <div className="text-[9px] font-black tracking-wider">RARE</div>
        </div>
      </div>

      {/* Badge at top-left */}
      <StarBadge
        size={40}
        className="absolute -top-3 -left-3 drop-shadow-lg rotate-[-10deg]"
      />
    </div>
  );
}

function StatLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center text-[12px]">
      <span className="text-parchment/75 uppercase tracking-wider text-[10px] font-bold">
        {label}
      </span>
      <span className="dotted-leader" />
      <span className="font-mono font-bold text-parchment">{value}</span>
    </div>
  );
}
