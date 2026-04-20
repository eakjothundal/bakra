export const W = 360;
export const H = 640;
export const BIRD_RADIUS = 20;
export const BIRD_X = 80;
export const PIPE_WIDTH = 60;
export const PIPE_GAP = 160;
export const PIPE_CAP_HEIGHT = 30;
export const PIPE_CAP_OVERHANG = 8;
export const PIPE_SPAWN_INTERVAL = 85;
export const SCROLL_SPEED = 2.3;
export const FLOOR_HEIGHT = 10;

const PIPE_GREEN = '#73BF2E';
const PIPE_DARK = '#1B8B2F';
const PIPE_LIGHT = '#95D35C';

export function drawBackground(ctx: CanvasRenderingContext2D, frame: number) {
  // Sunset gradient sky
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#1a1410');
  sky.addColorStop(0.4, '#3a1a12');
  sky.addColorStop(0.75, '#8b3a1f');
  sky.addColorStop(1, '#D4A017');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  // Sun disc behind scene
  ctx.fillStyle = 'rgba(255, 215, 120, 0.4)';
  ctx.beginPath();
  ctx.arc(W * 0.72, H * 0.55, 60, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 215, 120, 0.25)';
  ctx.beginPath();
  ctx.arc(W * 0.72, H * 0.55, 90, 0, Math.PI * 2);
  ctx.fill();

  // Distant mountains (slow parallax)
  const m1 = (frame * 0.15) % W;
  drawMountains(ctx, H * 0.62, '#2a1512', m1);
  // Near mountains (faster)
  const m2 = (frame * 0.35) % W;
  drawMountains(ctx, H * 0.72, '#1a0d08', m2);
}

function drawMountains(
  ctx: CanvasRenderingContext2D,
  baseY: number,
  color: string,
  offset: number,
) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, H);
  const peaks = [
    [0, 0], [60, -42], [110, -18], [170, -58], [230, -22],
    [290, -46], [360, -14], [430, -50], [W, -28],
  ];
  ctx.moveTo(-offset, baseY);
  peaks.forEach(([x, dy]) => ctx.lineTo(x - offset, baseY + dy));
  // second pass (wrap)
  peaks.forEach(([x, dy]) => ctx.lineTo(x + W - offset, baseY + dy));
  ctx.lineTo(W, H);
  ctx.lineTo(0, H);
  ctx.closePath();
  ctx.fill();
}

export function drawFloor(ctx: CanvasRenderingContext2D, frame: number) {
  // Ground dirt band
  ctx.fillStyle = '#2a1610';
  ctx.fillRect(0, H - FLOOR_HEIGHT - 8, W, 8);
  // Main floor
  ctx.fillStyle = '#8B3A1F';
  ctx.fillRect(0, H - FLOOR_HEIGHT, W, FLOOR_HEIGHT);
  // Moving cracks/texture on floor
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  const cracks = 10;
  for (let i = 0; i < cracks; i++) {
    const x = (i * (W / cracks) - ((frame * SCROLL_SPEED) % (W / cracks))) % W;
    ctx.fillRect(x, H - FLOOR_HEIGHT + 3, 2, 2);
    ctx.fillRect(x + 16, H - FLOOR_HEIGHT + 6, 3, 1);
  }
  // Top edge
  ctx.fillStyle = '#D4A017';
  ctx.fillRect(0, H - FLOOR_HEIGHT - 2, W, 2);
}

function drawPipeBody(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  ctx.fillStyle = PIPE_GREEN;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = PIPE_LIGHT;
  ctx.fillRect(x, y, 4, h);
  ctx.fillStyle = PIPE_DARK;
  ctx.fillRect(x + w - 2, y, 2, h);
}

function drawPipeCap(
  ctx: CanvasRenderingContext2D,
  pipeX: number,
  capY: number,
  isTop: boolean,
) {
  const x = pipeX - PIPE_CAP_OVERHANG;
  const w = PIPE_WIDTH + PIPE_CAP_OVERHANG * 2;
  ctx.fillStyle = PIPE_GREEN;
  ctx.fillRect(x, capY, w, PIPE_CAP_HEIGHT);
  ctx.fillStyle = PIPE_LIGHT;
  ctx.fillRect(x, capY, 4, PIPE_CAP_HEIGHT);
  ctx.fillStyle = PIPE_DARK;
  ctx.fillRect(x + w - 2, capY, 2, PIPE_CAP_HEIGHT);
  if (isTop) {
    ctx.fillRect(x, capY, w, 2);
  } else {
    ctx.fillRect(x, capY + PIPE_CAP_HEIGHT - 2, w, 2);
  }
}

export function drawPipe(
  ctx: CanvasRenderingContext2D,
  x: number,
  gapY: number,
) {
  const topBodyBottom = gapY - PIPE_GAP / 2 - PIPE_CAP_HEIGHT;
  if (topBodyBottom > 0) {
    drawPipeBody(ctx, x, 0, PIPE_WIDTH, topBodyBottom);
  }
  drawPipeCap(ctx, x, gapY - PIPE_GAP / 2 - PIPE_CAP_HEIGHT, true);

  drawPipeCap(ctx, x, gapY + PIPE_GAP / 2, false);
  const botBodyTop = gapY + PIPE_GAP / 2 + PIPE_CAP_HEIGHT;
  const botBodyH = H - FLOOR_HEIGHT - botBodyTop;
  if (botBodyH > 0) {
    drawPipeBody(ctx, x, botBodyTop, PIPE_WIDTH, botBodyH);
  }
}

export function drawBird(
  ctx: CanvasRenderingContext2D,
  y: number,
  vy: number,
  sprite: HTMLImageElement | null,
  emojiFallback: string,
) {
  const rotation = Math.max(-0.5, Math.min(1.2, vy * 0.08));
  ctx.save();
  ctx.translate(BIRD_X, y);
  ctx.rotate(rotation);

  if (sprite && sprite.complete && sprite.naturalWidth > 0) {
    ctx.drawImage(sprite, -24, -24, 48, 48);
  } else {
    // Emoji fallback — render via fillText
    ctx.font = '40px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';
    ctx.fillText(emojiFallback, 0, 0);
  }

  ctx.restore();
}

export function drawOverlay(
  ctx: CanvasRenderingContext2D,
  lines: Array<{
    text: string;
    size: number;
    color: string;
    weight?: number;
    font?: 'inter' | 'rye' | 'mono';
    shadow?: boolean;
  }>,
  alpha = 0.65,
) {
  // Vignette backdrop
  const grad = ctx.createRadialGradient(W / 2, H / 2, 40, W / 2, H / 2, W);
  grad.addColorStop(0, `rgba(0,0,0,${alpha - 0.05})`);
  grad.addColorStop(1, `rgba(0,0,0,${Math.min(1, alpha + 0.25)})`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Decorative banner plate
  const plateW = W - 40;
  const plateH = lines.reduce((a, l) => a + l.size + 14, 0) + 48;
  const plateX = 20;
  const plateY = H / 2 - plateH / 2;
  ctx.fillStyle = 'rgba(26,20,16,0.75)';
  roundRect(ctx, plateX, plateY, plateW, plateH, 18);
  ctx.fill();
  ctx.strokeStyle = 'rgba(212,160,23,0.7)';
  ctx.lineWidth = 2;
  roundRect(ctx, plateX, plateY, plateW, plateH, 18);
  ctx.stroke();
  // Inner dashed border
  ctx.save();
  ctx.setLineDash([4, 4]);
  ctx.strokeStyle = 'rgba(212,160,23,0.35)';
  ctx.lineWidth = 1;
  roundRect(ctx, plateX + 8, plateY + 8, plateW - 16, plateH - 16, 12);
  ctx.stroke();
  ctx.restore();

  // Stars at top corners of plate
  drawSmallStar(ctx, plateX + 14, plateY + 14, '#D4A017');
  drawSmallStar(ctx, plateX + plateW - 14, plateY + 14, '#D4A017');
  drawSmallStar(ctx, plateX + 14, plateY + plateH - 14, '#D4A017');
  drawSmallStar(ctx, plateX + plateW - 14, plateY + plateH - 14, '#D4A017');

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const totalH = lines.reduce((a, l) => a + l.size + 10, 0);
  let y = H / 2 - totalH / 2 + 6;
  for (const line of lines) {
    const fontFamily =
      line.font === 'rye' ? 'Rye, serif' :
      line.font === 'mono' ? '"Space Mono", monospace' :
      'Inter, sans-serif';
    ctx.font = `${line.weight ?? 900} ${line.size}px ${fontFamily}`;
    y += line.size / 2;
    if (line.shadow) {
      ctx.fillStyle = 'rgba(0,0,0,0.65)';
      ctx.fillText(line.text, W / 2 + 2, y + 2);
    }
    ctx.fillStyle = line.color;
    ctx.fillText(line.text, W / 2, y);
    y += line.size / 2 + 10;
  }
}

function drawSmallStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, color: string) {
  ctx.fillStyle = color;
  ctx.beginPath();
  const r = 5;
  for (let i = 0; i < 10; i++) {
    const angle = (i * Math.PI) / 5 - Math.PI / 2;
    const rad = i % 2 === 0 ? r : r * 0.45;
    const px = cx + Math.cos(angle) * rad;
    const py = cy + Math.sin(angle) * rad;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function drawScore(ctx: CanvasRenderingContext2D, score: number) {
  const cx = W / 2;
  const cy = 36;

  // Saloon sign shape
  ctx.save();
  ctx.fillStyle = 'rgba(26,20,16,0.75)';
  roundRect(ctx, cx - 46, cy - 22, 92, 44, 10);
  ctx.fill();
  ctx.strokeStyle = '#D4A017';
  ctx.lineWidth = 2;
  roundRect(ctx, cx - 46, cy - 22, 92, 44, 10);
  ctx.stroke();
  // Inner dashed
  ctx.setLineDash([3, 3]);
  ctx.strokeStyle = 'rgba(212,160,23,0.4)';
  ctx.lineWidth = 1;
  roundRect(ctx, cx - 41, cy - 17, 82, 34, 7);
  ctx.stroke();
  ctx.restore();

  // Stars flanking
  drawSmallStar(ctx, cx - 35, cy, '#D4A017');
  drawSmallStar(ctx, cx + 35, cy, '#D4A017');

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#D4A017';
  ctx.font = '900 26px "Space Mono", monospace';
  ctx.fillText(String(score).padStart(2, '0'), cx, cy + 1);
}
