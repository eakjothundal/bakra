import type { SVGProps } from 'react';

export function StarBadge({ size = 48, ...p }: { size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} {...p}>
      <defs>
        <radialGradient id="sb-grad" cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor="#FFD84A" />
          <stop offset="60%" stopColor="#D4A017" />
          <stop offset="100%" stopColor="#8B6A0F" />
        </radialGradient>
      </defs>
      <polygon
        points="50,5 61,38 96,38 67,58 78,92 50,72 22,92 33,58 4,38 39,38"
        fill="url(#sb-grad)"
        stroke="#8B3A1F"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <polygon
        points="50,20 57,40 78,40 61,52 68,72 50,60 32,72 39,52 22,40 43,40"
        fill="none"
        stroke="rgba(255,248,231,0.45)"
        strokeWidth="1.2"
      />
    </svg>
  );
}

export function SparkleStar({ size = 20, ...p }: { size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} {...p}>
      <path
        d="M12 2 L13.5 10.5 L22 12 L13.5 13.5 L12 22 L10.5 13.5 L2 12 L10.5 10.5 Z"
        fill="#D4A017"
      />
    </svg>
  );
}

export function Fleur({ size = 24, color = '#D4A017', ...p }: { size?: number; color?: string } & SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 60 20" width={size * 3} height={size} {...p}>
      <g fill={color}>
        <circle cx="30" cy="10" r="3" />
        <circle cx="20" cy="10" r="1.5" />
        <circle cx="40" cy="10" r="1.5" />
        <path d="M0 10 L16 10 M44 10 L60 10" stroke={color} strokeWidth="1.2" />
        <path d="M30 2 L30 6 M30 14 L30 18" stroke={color} strokeWidth="1.2" />
      </g>
    </svg>
  );
}

export function RaysBurst({
  className,
  color = '#D4A017',
  count = 16,
  ...p
}: { color?: string; count?: number } & SVGProps<SVGSVGElement>) {
  const rays = Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * 360;
    return (
      <line
        key={i}
        x1="50"
        y1="50"
        x2="50"
        y2="0"
        stroke={color}
        strokeWidth={i % 2 === 0 ? 2.2 : 1.1}
        strokeLinecap="round"
        transform={`rotate(${angle} 50 50)`}
        opacity={i % 2 === 0 ? 0.9 : 0.45}
      />
    );
  });
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      preserveAspectRatio="xMidYMid meet"
      {...p}
    >
      {rays}
    </svg>
  );
}

export function CornerBracket({
  size = 38,
  color = '#D4A017',
  ...p
}: { size?: number; color?: string } & SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} {...p}>
      <g fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
        <path d="M3 20 Q3 3 20 3" />
        <path d="M8 20 Q8 8 20 8" />
      </g>
      <circle cx="20" cy="3" r="1.5" fill={color} />
      <circle cx="3" cy="20" r="1.5" fill={color} />
    </svg>
  );
}

export function Rope({
  width = '100%',
  height = 8,
  color = '#D4A017',
}: {
  width?: number | string;
  height?: number;
  color?: string;
}) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 200 8"
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <pattern id="rope" width="8" height="8" patternUnits="userSpaceOnUse">
          <path d="M0 4 Q2 0 4 4 Q6 8 8 4" stroke={color} strokeWidth="1.4" fill="none" />
        </pattern>
      </defs>
      <rect width="200" height="8" fill="url(#rope)" />
    </svg>
  );
}

export function DividerFancy({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 text-brass/70">
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-brass/60 to-brass/60" />
      <Fleur size={16} />
      {label && (
        <span className="text-[10px] tracking-[0.3em] uppercase text-brass/80 font-bold">
          {label}
        </span>
      )}
      <Fleur size={16} />
      <div className="flex-1 h-px bg-gradient-to-l from-transparent via-brass/60 to-brass/60" />
    </div>
  );
}

export function HorseShoe({ size = 28, color = '#D4A017', ...p }: { size?: number; color?: string } & SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} {...p}>
      <path
        d="M8 6 Q4 12 4 18 Q4 26 10 28 L12 24 Q8 22 8 18 Q8 14 10 10 M24 6 Q28 12 28 18 Q28 26 22 28 L20 24 Q24 22 24 18 Q24 14 22 10"
        fill={color}
        stroke="#8B3A1F"
        strokeWidth="1"
      />
      <circle cx="7" cy="9" r="1.2" fill="#8B3A1F" />
      <circle cx="25" cy="9" r="1.2" fill="#8B3A1F" />
    </svg>
  );
}
