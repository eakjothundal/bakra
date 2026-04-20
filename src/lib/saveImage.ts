import html2canvas from 'html2canvas';

async function waitForFonts() {
  try {
    const fonts = (document as Document & { fonts?: { ready: Promise<unknown> } }).fonts;
    if (fonts?.ready) await fonts.ready;
  } catch {
    // ignore
  }
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png');
  });
}

function isMobile(): boolean {
  return /iphone|ipad|ipod|android/i.test(navigator.userAgent);
}

export type SaveOutcome = 'shared' | 'downloaded' | 'longpress';

export interface SaveImageOptions {
  background?: string;
  scale?: number;
  shareTitle?: string;
  shareText?: string;
  onLongPressFallback?: (objectUrl: string) => void;
}

export interface RenderedImage {
  blob: Blob;
  file: File;
  objectUrl: string;
}

export async function renderElement(
  elementId: string,
  filename: string,
  opts: { background?: string; scale?: number } = {},
): Promise<RenderedImage> {
  const el = document.getElementById(elementId);
  if (!el) throw new Error(`Element #${elementId} not found`);
  await waitForFonts();
  const canvas = await html2canvas(el, {
    backgroundColor: opts.background ?? '#1a1410',
    scale: opts.scale ?? 3,
    useCORS: true,
    logging: false,
  });
  const blob = await canvasToBlob(canvas);
  const file = new File([blob], filename, { type: 'image/png' });
  const objectUrl = URL.createObjectURL(blob);
  return { blob, file, objectUrl };
}

export async function saveRenderedImage(
  rendered: RenderedImage,
  filename: string,
  opts: SaveImageOptions = {},
): Promise<SaveOutcome> {
  const nav = navigator as Navigator & {
    canShare?: (data: ShareData) => boolean;
    share?: (data: ShareData) => Promise<void>;
  };
  const shareData: ShareData = {
    files: [rendered.file],
    title: opts.shareTitle,
    text: opts.shareText,
  };

  if (isMobile() && nav.canShare && nav.canShare(shareData) && nav.share) {
    try {
      await nav.share(shareData);
      return 'shared';
    } catch (err) {
      const e = err as { name?: string };
      if (e?.name === 'AbortError') {
        // user cancelled — treat as shared, no fallback
        return 'shared';
      }
      // fall through to longpress / download
    }
  }

  if (isMobile() && opts.onLongPressFallback) {
    opts.onLongPressFallback(rendered.objectUrl);
    return 'longpress';
  }

  const link = document.createElement('a');
  link.href = rendered.objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  return 'downloaded';
}

export async function saveElementAsImage(
  elementId: string,
  filename: string,
  opts: SaveImageOptions = {},
): Promise<SaveOutcome> {
  const rendered = await renderElement(elementId, filename, {
    background: opts.background,
    scale: opts.scale,
  });
  try {
    return await saveRenderedImage(rendered, filename, opts);
  } finally {
    if (!isMobile() || !opts.onLongPressFallback) {
      setTimeout(() => URL.revokeObjectURL(rendered.objectUrl), 2000);
    }
  }
}
