import { useEffect, useRef } from 'react';
import type { Character } from '../types';
import { CHARACTERS } from './characters';
import {
  BIRD_RADIUS,
  BIRD_X,
  FLOOR_HEIGHT,
  H,
  PIPE_GAP,
  PIPE_SPAWN_INTERVAL,
  PIPE_WIDTH,
  SCROLL_SPEED,
  W,
  drawBackground,
  drawBird,
  drawFloor,
  drawOverlay,
  drawPipe,
  drawScore,
} from './renderer';

interface Props {
  character: Character;
  onScore: (n: number) => void;
  onGameEnd: (score: number) => void;
}

interface Pipe {
  x: number;
  gapY: number;
  passed: boolean;
}

type Phase = 'waiting' | 'playing' | 'gameover';

export function FlappyBakra({ character, onScore, onGameEnd }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef({
    phase: 'waiting' as Phase,
    birdY: H / 2,
    birdVY: 0,
    pipes: [] as Pipe[],
    frame: 0,
    score: 0,
  });
  const spriteRef = useRef<HTMLImageElement | null>(null);

  const charCfg = CHARACTERS[character];

  useEffect(() => {
    const img = new Image();
    img.src = charCfg.sprite;
    img.onload = () => {
      spriteRef.current = img;
    };
    img.onerror = () => {
      spriteRef.current = null;
    };
  }, [charCfg.sprite]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const reset = () => {
      stateRef.current = {
        phase: 'waiting',
        birdY: H / 2,
        birdVY: 0,
        pipes: [],
        frame: 0,
        score: 0,
      };
      onScore(0);
    };

    const flap = () => {
      const s = stateRef.current;
      if (s.phase === 'gameover') {
        reset();
        return;
      }
      if (s.phase === 'waiting') s.phase = 'playing';
      s.birdVY = charCfg.physics.flap;
    };

    const handleDown = (e: Event) => {
      e.preventDefault();
      flap();
    };
    canvas.addEventListener('mousedown', handleDown);
    canvas.addEventListener('touchstart', handleDown, { passive: false });

    const loop = () => {
      const s = stateRef.current;
      const { gravity, terminalVelocity } = charCfg.physics;

      if (s.phase === 'playing') {
        s.frame++;

        s.birdVY = Math.min(s.birdVY + gravity, terminalVelocity);
        s.birdY += s.birdVY;

        if (s.frame % PIPE_SPAWN_INTERVAL === 0) {
          s.pipes.push({
            x: W + 10,
            gapY: 100 + Math.random() * (H - 220),
            passed: false,
          });
        }

        for (const p of s.pipes) p.x -= SCROLL_SPEED;
        for (let i = s.pipes.length - 1; i >= 0; i--) {
          if (s.pipes[i].x + PIPE_WIDTH <= -60) s.pipes.splice(i, 1);
        }

        // Score detection (before moving bird x — bird x is fixed anyway)
        for (const p of s.pipes) {
          if (!p.passed && p.x + PIPE_WIDTH < BIRD_X) {
            p.passed = true;
            s.score++;
            onScore(s.score);
          }
        }

        // Collisions
        const hitFloor = s.birdY + BIRD_RADIUS > H - FLOOR_HEIGHT;
        const hitCeiling = s.birdY - BIRD_RADIUS < 0;
        let hitPipe = false;
        const r = BIRD_RADIUS;
        for (const p of s.pipes) {
          if (
            BIRD_X + r * 0.6 > p.x &&
            BIRD_X - r * 0.6 < p.x + PIPE_WIDTH
          ) {
            if (
              s.birdY - r * 0.5 < p.gapY - PIPE_GAP / 2 ||
              s.birdY + r * 0.5 > p.gapY + PIPE_GAP / 2
            ) {
              hitPipe = true;
              break;
            }
          }
        }
        if (hitFloor || hitCeiling || hitPipe) {
          s.phase = 'gameover';
          onGameEnd(s.score);
        }
        if (hitFloor) s.birdY = H - FLOOR_HEIGHT - BIRD_RADIUS;
      }

      // Render
      drawBackground(ctx, s.frame);
      for (const p of s.pipes) drawPipe(ctx, p.x, p.gapY);
      drawFloor(ctx, s.frame);
      drawBird(ctx, s.birdY, s.birdVY, spriteRef.current, charCfg.emoji);
      drawScore(ctx, s.score);

      if (s.phase === 'waiting') {
        drawOverlay(
          ctx,
          [
            { text: '★ FLAPPY BAKRA ★', size: 16, color: '#D4A017', weight: 700 },
            { text: 'TAP TO FLAP', size: 30, color: '#FFF8E7', font: 'rye', shadow: true },
            { text: 'how high can you fly?', size: 12, color: '#FFF8E7', weight: 500 },
          ],
          0.7,
        );
      } else if (s.phase === 'gameover') {
        drawOverlay(
          ctx,
          [
            { text: '✦ GAME OVER ✦', size: 14, color: '#8b3a1f', weight: 700 },
            { text: 'YOU GOT GOATED', size: 28, color: '#D4A017', font: 'rye', shadow: true },
            { text: `score · ${s.score}`, size: 14, color: '#FFF8E7', weight: 700, font: 'mono' },
            { text: 'tap to try again', size: 12, color: '#FFF8E7', weight: 500 },
          ],
          0.82,
        );
      }

      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      canvas.removeEventListener('mousedown', handleDown);
      canvas.removeEventListener('touchstart', handleDown);
    };
  }, [charCfg, onScore, onGameEnd]);

  return (
    <canvas
      ref={canvasRef}
      className="block rounded-2xl shadow-[0_12px_30px_rgba(0,0,0,0.5)] border border-brass/25 select-none"
      style={{ width: W, height: H, touchAction: 'none' }}
      aria-label="Flappy Bakra game canvas"
    />
  );
}
