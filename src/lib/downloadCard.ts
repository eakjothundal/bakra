import html2canvas from 'html2canvas';

async function waitForFonts() {
  try {
    const fonts = (document as Document & { fonts?: { ready: Promise<unknown> } }).fonts;
    if (fonts?.ready) await fonts.ready;
  } catch {
    // ignore
  }
}

export async function downloadElement(
  elementId: string,
  filename: string,
  opts: { background?: string; scale?: number } = {},
) {
  const el = document.getElementById(elementId);
  if (!el) throw new Error(`Element #${elementId} not found`);
  await waitForFonts();

  const canvas = await html2canvas(el, {
    backgroundColor: opts.background ?? '#1a1410',
    scale: opts.scale ?? 3,
    useCORS: true,
    logging: false,
  });
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  link.click();
}
