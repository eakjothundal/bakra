const WIDTH = 1080;
const HEIGHT = 1920;

const BG = '#1a1410';
const BG_WARM = '#2a1b12';
const BRASS = '#d4a017';
const BRASS_DIM = 'rgba(212,160,23,0.5)';
const PARCHMENT = '#fff8e7';

async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function ensureFonts() {
  if (!document.fonts) return;
  try {
    await Promise.all([
      document.fonts.load('900 72px "Rye"'),
      document.fonts.load('900 200px "Rye"'),
      document.fonts.load('700 28px "Inter"'),
      document.fonts.load('900 40px "Inter"'),
      document.fonts.ready,
    ]);
  } catch {
    // fall through — we'll still render with fallback fonts
  }
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawCornerBracket(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  flipX: number,
  flipY: number,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(flipX, flipY);
  ctx.strokeStyle = BRASS;
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 64);
  ctx.lineTo(0, 0);
  ctx.lineTo(64, 0);
  ctx.stroke();

  // inner accent
  ctx.strokeStyle = BRASS_DIM;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(14, 54);
  ctx.lineTo(14, 14);
  ctx.lineTo(54, 14);
  ctx.stroke();

  // little star
  ctx.fillStyle = BRASS;
  ctx.font = '900 28px "Inter", serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('★', 32, 32);
  ctx.restore();
}

function drawRays(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  innerR: number,
  outerR: number,
  count: number,
) {
  ctx.save();
  ctx.translate(cx, cy);
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    ctx.save();
    ctx.rotate(angle);
    const grad = ctx.createLinearGradient(0, innerR, 0, outerR);
    grad.addColorStop(0, 'rgba(212,160,23,0.55)');
    grad.addColorStop(1, 'rgba(212,160,23,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(-9, innerR);
    ctx.lineTo(9, innerR);
    ctx.lineTo(0, outerR);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

function drawSparkle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color = BRASS,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = color;
  ctx.beginPath();
  const arms = [
    [0, -size],
    [size * 0.25, -size * 0.25],
    [size, 0],
    [size * 0.25, size * 0.25],
    [0, size],
    [-size * 0.25, size * 0.25],
    [-size, 0],
    [-size * 0.25, -size * 0.25],
  ];
  ctx.moveTo(arms[0][0], arms[0][1]);
  for (let i = 1; i < arms.length; i++) ctx.lineTo(arms[i][0], arms[i][1]);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawDashedDivider(
  ctx: CanvasRenderingContext2D,
  x1: number,
  x2: number,
  y: number,
) {
  ctx.save();
  ctx.strokeStyle = 'rgba(212,160,23,0.4)';
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 8]);
  ctx.beginPath();
  ctx.moveTo(x1, y);
  ctx.lineTo(x2, y);
  ctx.stroke();
  ctx.restore();
}

function drawFancyDivider(
  ctx: CanvasRenderingContext2D,
  cx: number,
  y: number,
  width: number,
  label?: string,
) {
  ctx.save();
  ctx.strokeStyle = BRASS;
  ctx.lineWidth = 2;
  const halfW = width / 2;
  const gap = label ? 120 : 20;

  ctx.beginPath();
  ctx.moveTo(cx - halfW, y);
  ctx.lineTo(cx - gap, y);
  ctx.moveTo(cx + gap, y);
  ctx.lineTo(cx + halfW, y);
  ctx.stroke();

  // diamond ornaments at the gaps
  for (const dx of [-gap + 10, gap - 10]) {
    ctx.fillStyle = BRASS;
    ctx.beginPath();
    ctx.moveTo(cx + dx, y - 8);
    ctx.lineTo(cx + dx + 8, y);
    ctx.lineTo(cx + dx, y + 8);
    ctx.lineTo(cx + dx - 8, y);
    ctx.closePath();
    ctx.fill();
  }

  if (label) {
    ctx.fillStyle = PARCHMENT;
    ctx.font = '900 22px "Inter", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.letterSpacing = '6px';
    ctx.fillText(label, cx, y);
  }
  ctx.restore();
}

function drawDetailRow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  label: string,
  lines: string[],
) {
  ctx.save();
  // label
  ctx.fillStyle = BRASS;
  ctx.font = '900 22px "Inter", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(label, x, y + 4);
  // label underline
  ctx.strokeStyle = BRASS_DIM;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y + 36);
  ctx.lineTo(x + 52, y + 36);
  ctx.stroke();

  // value(s)
  ctx.fillStyle = PARCHMENT;
  ctx.font = '700 34px "Inter", sans-serif';
  const valueX = x + 150;
  let cy = y + 2;
  for (const line of lines) {
    ctx.fillText(line, valueX, cy);
    cy += 44;
  }
  ctx.restore();
  return cy - y; // height used
}

function drawCenteredText(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  cy: number,
  font: string,
  color: string,
  letterSpacing = 0,
) {
  ctx.save();
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  if (letterSpacing <= 0) {
    ctx.textAlign = 'center';
    ctx.fillText(text, cx, cy);
    ctx.restore();
    return;
  }
  // manual letter-spacing
  const widths = [...text].map((ch) => ctx.measureText(ch).width);
  const total = widths.reduce((s, w) => s + w, 0) + letterSpacing * (text.length - 1);
  let x = cx - total / 2;
  for (let i = 0; i < text.length; i++) {
    ctx.fillText(text[i], x, cy);
    x += widths[i] + letterSpacing;
  }
  ctx.restore();
}

export async function buildInviteImage(heroSrc: string): Promise<string> {
  await ensureFonts();
  const hero = await loadImage(heroSrc);

  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No 2D context');

  // Background gradient
  const bg = ctx.createRadialGradient(
    WIDTH / 2,
    HEIGHT * 0.3,
    0,
    WIDTH / 2,
    HEIGHT * 0.5,
    HEIGHT * 0.75,
  );
  bg.addColorStop(0, BG_WARM);
  bg.addColorStop(0.7, BG);
  bg.addColorStop(1, '#0f0a07');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Subtle rust glow at top & bottom
  const glowTop = ctx.createRadialGradient(WIDTH / 2, 0, 0, WIDTH / 2, 0, WIDTH * 0.75);
  glowTop.addColorStop(0, 'rgba(139,58,31,0.28)');
  glowTop.addColorStop(1, 'rgba(139,58,31,0)');
  ctx.fillStyle = glowTop;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  const glowBot = ctx.createRadialGradient(WIDTH / 2, HEIGHT, 0, WIDTH / 2, HEIGHT, WIDTH * 0.75);
  glowBot.addColorStop(0, 'rgba(139,58,31,0.22)');
  glowBot.addColorStop(1, 'rgba(139,58,31,0)');
  ctx.fillStyle = glowBot;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Scatter stars
  const scatter = [
    [90, 180, 18],
    [980, 140, 14],
    [130, 1100, 16],
    [960, 1240, 20],
    [80, 1700, 14],
    [990, 1760, 18],
    [60, 900, 10],
    [1010, 960, 12],
  ] as const;
  for (const [x, y, s] of scatter) drawSparkle(ctx, x, y, s, 'rgba(212,160,23,0.55)');

  // Parchment/poster panel
  const panelX = 60;
  const panelY = 100;
  const panelW = WIDTH - panelX * 2;
  const panelH = HEIGHT - panelY - 140;

  // Panel fill
  const panelGrad = ctx.createLinearGradient(0, panelY, 0, panelY + panelH);
  panelGrad.addColorStop(0, 'rgba(42,27,18,0.85)');
  panelGrad.addColorStop(1, 'rgba(26,20,16,0.92)');
  ctx.fillStyle = panelGrad;
  roundedRect(ctx, panelX, panelY, panelW, panelH, 24);
  ctx.fill();

  // Panel brass border (double line)
  ctx.strokeStyle = BRASS;
  ctx.lineWidth = 4;
  roundedRect(ctx, panelX, panelY, panelW, panelH, 24);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(212,160,23,0.45)';
  ctx.lineWidth = 2;
  ctx.setLineDash([]);
  roundedRect(ctx, panelX + 14, panelY + 14, panelW - 28, panelH - 28, 16);
  ctx.stroke();

  // Corner brackets
  drawCornerBracket(ctx, panelX + 24, panelY + 24, 1, 1);
  drawCornerBracket(ctx, panelX + panelW - 24, panelY + 24, -1, 1);
  drawCornerBracket(ctx, panelX + 24, panelY + panelH - 24, 1, -1);
  drawCornerBracket(ctx, panelX + panelW - 24, panelY + panelH - 24, -1, -1);

  const cx = WIDTH / 2;
  let cy = panelY + 100;

  // Top banner — "ABEL & ASTRO INVITE YOU TO"
  drawCenteredText(
    ctx,
    'ABEL & ASTRO',
    cx,
    cy,
    '900 30px "Inter", sans-serif',
    BRASS,
    10,
  );
  cy += 44;
  drawCenteredText(
    ctx,
    'INVITE YOU TO THE',
    cx,
    cy,
    '900 30px "Inter", sans-serif',
    BRASS,
    10,
  );

  cy += 50;

  // Main title "BAKRA PARTY"
  ctx.save();
  ctx.fillStyle = PARCHMENT;
  ctx.font = '400 170px "Rye", "Playfair Display", serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(139,58,31,0.7)';
  ctx.shadowOffsetY = 6;
  ctx.shadowBlur = 0;
  ctx.fillText('BAKRA', cx, cy + 80);
  ctx.fillText('PARTY', cx, cy + 250);
  ctx.restore();

  cy += 350;

  // "A GOATED OCCASION"
  drawCenteredText(
    ctx,
    'A GOATED OCCASION',
    cx,
    cy,
    '900 30px "Inter", sans-serif',
    'rgba(212,160,23,0.85)',
    10,
  );
  // fleurs either side — measure text so the fleurs sit clear of the letters
  ctx.save();
  ctx.font = '900 30px "Inter", sans-serif';
  const occWidth = ctx.measureText('A GOATED OCCASION').width + 10 * 16;
  ctx.font = '900 26px "Inter", serif';
  ctx.fillStyle = BRASS;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('✦', cx - occWidth / 2 - 40, cy);
  ctx.fillText('✦', cx + occWidth / 2 + 40, cy);
  ctx.restore();

  cy += 40;

  // Hero + rays section — cap by both width and max height
  const HERO_MAX_W = 480;
  const HERO_MAX_H = 600;
  const heroRatio = hero.height / hero.width;
  let heroW = HERO_MAX_W;
  let heroH = heroW * heroRatio;
  if (heroH > HERO_MAX_H) {
    heroH = HERO_MAX_H;
    heroW = heroH / heroRatio;
  }
  const heroTop = cy;
  const heroCy = heroTop + heroH / 2;

  drawRays(ctx, cx, heroCy, 130, 320, 28);

  const aura = ctx.createRadialGradient(cx, heroCy - 20, 0, cx, heroCy - 20, 240);
  aura.addColorStop(0, 'rgba(245,208,96,0.55)');
  aura.addColorStop(0.4, 'rgba(212,160,23,0.3)');
  aura.addColorStop(1, 'rgba(212,160,23,0)');
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.arc(cx, heroCy - 20, 240, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.65)';
  ctx.shadowBlur = 26;
  ctx.shadowOffsetY = 14;
  ctx.drawImage(hero, cx - heroW / 2, heroTop, heroW, heroH);
  ctx.restore();

  drawSparkle(ctx, cx - 230, heroCy - 130, 14);
  drawSparkle(ctx, cx + 220, heroCy - 110, 12);
  drawSparkle(ctx, cx - 200, heroCy + 130, 10);
  drawSparkle(ctx, cx + 230, heroCy + 150, 14);

  cy = heroTop + heroH + 50;

  // Divider "THE DETAILS"
  drawFancyDivider(ctx, cx, cy, 680, 'THE DETAILS');

  cy += 70;

  // Details rows
  const detailsX = panelX + 80;
  const contentW = panelW - 160;

  let used = drawDetailRow(ctx, detailsX, cy,'WHEN', [
    'Tue · May 19, 2026 · 6 PM',
  ]);
  cy += used + 18;
  drawDashedDivider(ctx, detailsX, detailsX + contentW, cy);
  cy += 18;

  used = drawDetailRow(ctx, detailsX, cy,'WHERE', [
    '2177 Donovan Dr, Lincoln CA',
  ]);
  cy += used + 18;
  drawDashedDivider(ctx, detailsX, detailsX + contentW, cy);
  cy += 18;

  used = drawDetailRow(ctx, detailsX, cy,'FIT', [
    "Wear your GOAT's jersey",
  ]);
  cy += used + 24;

  // Divider
  drawFancyDivider(ctx, cx, cy, 680);
  cy += 50;

  // Footer inside the panel — website link
  drawCenteredText(
    ctx,
    'HTTPS://EAKJOT.NETLIFY.APP',
    cx,
    cy + 24,
    '900 28px "Inter", sans-serif',
    BRASS,
    8,
  );

  // Bottom ornament outside the panel
  drawCenteredText(
    ctx,
    '★ EST. 2026 ★',
    cx,
    HEIGHT - 80,
    '400 36px "Rye", serif',
    'rgba(255,248,231,0.65)',
    6,
  );

  // Tiny paint: darker vignette at edges
  const vignette = ctx.createRadialGradient(
    WIDTH / 2,
    HEIGHT / 2,
    WIDTH * 0.4,
    WIDTH / 2,
    HEIGHT / 2,
    WIDTH * 0.9,
  );
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(0,0,0,0.55)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  return new Promise<string>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) return reject(new Error('toBlob failed'));
        resolve(URL.createObjectURL(blob));
      },
      'image/png',
      0.95,
    );
  });
}

// Suppress 'letterSpacing' type mismatch for older lib.dom (canvas letterSpacing is supported modern browsers)
declare global {
  interface CanvasRenderingContext2D {
    letterSpacing: string;
  }
}
