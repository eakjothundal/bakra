import { useCallback, useEffect, useRef, useState } from 'react';

interface Drop {
  id: number;
  x: number;
  y: number;
  dx: number;
  r: number;
  delay: number;
}

let nextId = 1;

export function useGoatRain() {
  const [drops, setDrops] = useState<Drop[]>([]);
  const timers = useRef<number[]>([]);

  const spawn = useCallback((x: number, y: number) => {
    const next: Drop[] = Array.from({ length: 5 }, () => ({
      id: nextId++,
      x,
      y,
      dx: (Math.random() - 0.5) * 100,
      r: Math.random() * 360,
      delay: Math.random() * 150,
    }));
    setDrops((d) => [...d, ...next]);
    next.forEach((drop) => {
      const t = window.setTimeout(
        () => setDrops((cur) => cur.filter((d) => d.id !== drop.id)),
        1500 + drop.delay,
      );
      timers.current.push(t);
    });
  }, []);

  useEffect(() => () => timers.current.forEach((t) => clearTimeout(t)), []);

  return { drops, spawn };
}

export function GoatRainLayer({ drops }: { drops: Drop[] }) {
  return (
    <>
      {drops.map((d) => (
        <span
          key={d.id}
          className="goat-drop"
          style={
            {
              left: d.x,
              top: d.y,
              ['--dx' as string]: `${d.dx}px`,
              ['--r' as string]: `${d.r}deg`,
              animationDelay: `${d.delay}ms`,
            } as React.CSSProperties
          }
          aria-hidden
        >
          🐐
        </span>
      ))}
    </>
  );
}
