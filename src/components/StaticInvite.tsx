const W = 1080;
const H = 1920;

const PARCHMENT = '#FFF8E7';
const BRASS = '#D4A017';
const RUST = '#8B3A1F';
const BRASS_DIM = 'rgba(212,160,23,0.55)';

// Hero section: 760×640 canvas. Hero image is 1024×1536 (ratio 1.5 h:w).
// At height 620px the image is 413px wide — fits inside 760px wide container.
const HERO_W = 760;
const HERO_H = 640;
const CX = 380; // center x
const CY = 320; // center y (HERO_H / 2)
const RAYS = 28;

export function StaticInvite() {
  const heroSrc = `${import.meta.env.BASE_URL}hero-eakjot.png`;

  return (
    <div
      id="static-invite"
      style={{
        position: 'fixed',
        left: -99999,
        top: 0,
        width: W,
        height: H,
        background:
          'radial-gradient(ellipse at 50% 32%, #2a1812 0%, #1a1410 60%, #0e0907 100%)',
        color: PARCHMENT,
        padding: 0,
        margin: 0,
        overflow: 'hidden',
        fontFamily: 'Inter, sans-serif',
      }}
      aria-hidden
    >
      {/* Outer frame — explicit sides for html2canvas compatibility */}
      <div
        style={{
          position: 'absolute',
          top: 40,
          right: 40,
          bottom: 40,
          left: 40,
          border: `4px double ${BRASS}`,
          borderRadius: 28,
          boxShadow: 'inset 0 0 0 2px rgba(139,58,31,0.45)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 64,
          right: 64,
          bottom: 64,
          left: 64,
          border: `2px dashed ${BRASS_DIM}`,
          borderRadius: 18,
          pointerEvents: 'none',
        }}
      />

      {/* Corner stars */}
      {[
        { top: 76, left: 76 },
        { top: 76, right: 76 },
        { bottom: 76, left: 76 },
        { bottom: 76, right: 76 },
      ].map((pos, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            ...pos,
            color: BRASS,
            fontSize: 44,
            lineHeight: 1,
          }}
        >
          ✦
        </div>
      ))}

      {/* Inner content — explicit sides for html2canvas compatibility */}
      <div
        style={{
          position: 'absolute',
          top: 110,
          right: 110,
          bottom: 110,
          left: 110,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* Top banner */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 28,
            color: BRASS,
            fontWeight: 800,
            letterSpacing: 14,
            fontSize: 28,
            textTransform: 'uppercase',
          }}
        >
          <Horseshoe />
          <span>Summons to the</span>
          <Horseshoe flip />
        </div>

        {/* Title */}
        <h1
          style={{
            marginTop: 18,
            marginBottom: 0,
            fontFamily: 'Rye, serif',
            fontSize: 192,
            lineHeight: 0.92,
            color: PARCHMENT,
            textAlign: 'center',
            textShadow: `8px 8px 0 ${RUST}, 0 0 36px rgba(212,160,23,0.45)`,
            letterSpacing: 4,
          }}
        >
          BAKRA
          <br />
          PARTY
        </h1>

        {/* Subtitle */}
        <div
          style={{
            marginTop: 14,
            color: BRASS,
            fontWeight: 800,
            letterSpacing: 12,
            fontSize: 24,
            textTransform: 'uppercase',
            display: 'flex',
            alignItems: 'center',
            gap: 18,
          }}
        >
          <span>✦</span>
          <span>A Goated Occasion</span>
          <span>✦</span>
        </div>

        {/* Hero with rays — fixed 760×640 so height-constrained image can't overflow */}
        <div
          style={{
            position: 'relative',
            marginTop: 22,
            width: HERO_W,
            height: HERO_H,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Sun rays */}
          <svg
            width={HERO_W}
            height={HERO_H}
            viewBox={`0 0 ${HERO_W} ${HERO_H}`}
            style={{ position: 'absolute', top: 0, left: 0, opacity: 0.7 }}
          >
            <defs>
              <radialGradient id="si-sun-glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(245,208,96,0.55)" />
                <stop offset="40%" stopColor="rgba(212,160,23,0.32)" />
                <stop offset="75%" stopColor="rgba(212,160,23,0)" />
              </radialGradient>
            </defs>
            <circle cx={CX} cy={CY} r={260} fill="url(#si-sun-glow)" />
            {Array.from({ length: RAYS }).map((_, i) => {
              const angle = (i / RAYS) * Math.PI * 2;
              const inner = 185;
              const outer = 280;
              const x1 = CX + Math.cos(angle) * inner;
              const y1 = CY + Math.sin(angle) * inner;
              const x2 = CX + Math.cos(angle) * outer;
              const y2 = CY + Math.sin(angle) * outer;
              return (
                <line
                  key={i}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={BRASS}
                  strokeWidth={3}
                  strokeLinecap="round"
                  opacity={i % 2 ? 0.5 : 0.85}
                />
              );
            })}
            {/* Outer dashed ring */}
            <circle
              cx={CX}
              cy={CY}
              r={295}
              fill="none"
              stroke={BRASS}
              strokeWidth={2}
              strokeDasharray="10 14"
              opacity={0.55}
            />
            {/* Inner ring */}
            <circle
              cx={CX}
              cy={CY}
              r={268}
              fill="none"
              stroke={BRASS}
              strokeWidth={1}
              strokeDasharray="4 8"
              opacity={0.4}
            />
          </svg>

          {/* Curved text ring */}
          <svg
            width={HERO_W}
            height={HERO_H}
            viewBox={`0 0 ${HERO_W} ${HERO_H}`}
            style={{ position: 'absolute', top: 0, left: 0 }}
          >
            <defs>
              <path
                id="si-ring-path"
                d={`M${CX},${CY} m-280,0 a280,280 0 1,1 560,0 a280,280 0 1,1 -560,0`}
              />
            </defs>
            <text
              fontSize={22}
              fontFamily="Rye, serif"
              letterSpacing={10}
              fill={BRASS}
              fontWeight={700}
            >
              <textPath href="#si-ring-path">
                ★ BAKRA PARTY 2026 ★ LINCOLN CA ★ MAY 19 ★ A GOATED OCCASION
              </textPath>
            </text>
          </svg>

          {/* Hero image — height-constrained so it can never overflow the container */}
          <img
            src={heroSrc}
            alt=""
            crossOrigin="anonymous"
            style={{
              position: 'relative',
              zIndex: 2,
              height: 620,
              width: 'auto',
              maxWidth: HERO_W,
              display: 'block',
            }}
          />
        </div>

        {/* Divider */}
        <Divider label="THE DETAILS" />

        {/* Details */}
        <div style={{ marginTop: 18, width: '100%', maxWidth: 760 }}>
          <DetailRow label="WHEN" value="TUE · MAY 19, 2026 · 6 PM" />
          <DashedRow />
          <DetailRow label="WHERE" value="2177 DONOVAN DR, LINCOLN CA" />
          <DashedRow />
          <DetailRow label="FIT" value="WEAR YOUR GOAT'S JERSEY · ANY SPORT" />
        </div>

        {/* Footer URL */}
        <div
          style={{
            marginTop: 'auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <Divider />
          <div
            style={{
              fontSize: 30,
              letterSpacing: 8,
              color: BRASS,
              fontWeight: 800,
              textTransform: 'uppercase',
              fontFamily: 'Rye, serif',
            }}
          >
            eakjot.dev/bakra
          </div>
          <div
            style={{
              fontSize: 18,
              letterSpacing: 6,
              color: 'rgba(255,248,231,0.55)',
              fontWeight: 700,
              textTransform: 'uppercase',
            }}
          >
            ★ EST. 2026 ★
          </div>
        </div>
      </div>
    </div>
  );
}

function Horseshoe({ flip }: { flip?: boolean }) {
  return (
    <svg
      width={36}
      height={36}
      viewBox="0 0 36 36"
      style={{ transform: flip ? 'scaleX(-1)' : undefined }}
    >
      <path
        d="M6 6 C 6 22, 14 30, 18 30 C 22 30, 30 22, 30 6 L 26 6 C 26 18, 22 24, 18 24 C 14 24, 10 18, 10 6 Z"
        fill={BRASS}
      />
    </svg>
  );
}

function Divider({ label }: { label?: string }) {
  return (
    <div
      style={{
        marginTop: 20,
        display: 'flex',
        alignItems: 'center',
        gap: 18,
        width: '100%',
        maxWidth: 760,
      }}
    >
      <div style={{ flex: 1, height: 2, background: BRASS_DIM }} />
      {label && (
        <div
          style={{
            color: BRASS,
            fontWeight: 900,
            letterSpacing: 8,
            fontSize: 22,
            textTransform: 'uppercase',
            fontFamily: 'Rye, serif',
          }}
        >
          ✦ {label} ✦
        </div>
      )}
      <div style={{ flex: 1, height: 2, background: BRASS_DIM }} />
    </div>
  );
}

function DashedRow() {
  return (
    <div
      style={{
        height: 0,
        borderTop: `2px dashed ${BRASS_DIM}`,
        margin: '12px 0',
      }}
    />
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 28, padding: '8px 0' }}>
      <div style={{ width: 120, flexShrink: 0 }}>
        <div
          style={{
            color: BRASS,
            fontWeight: 900,
            fontSize: 20,
            letterSpacing: 7,
            textTransform: 'uppercase',
            lineHeight: 1,
          }}
        >
          {label}
        </div>
        <div style={{ width: 50, height: 2, background: BRASS_DIM, marginTop: 8 }} />
      </div>
      <div
        style={{
          flex: 1,
          color: PARCHMENT,
          fontWeight: 700,
          fontSize: 28,
          letterSpacing: 1,
          lineHeight: 1.3,
        }}
      >
        {value}
      </div>
    </div>
  );
}
