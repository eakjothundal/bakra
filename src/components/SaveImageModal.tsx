import { useEffect } from 'react';

interface Props {
  src: string;
  filename: string;
  onClose: () => void;
}

export function SaveImageModal({ src, filename, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    document.documentElement.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.documentElement.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal
      aria-label="Save image"
      onClick={onClose}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center px-5 py-6 bg-black/85 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[420px] flex flex-col items-center"
      >
        <div className="text-[10px] tracking-[0.4em] uppercase text-brass font-black">
          ◈ Save to Photos ◈
        </div>
        <div className="mt-2 text-center text-[12px] text-parchment/85 leading-relaxed">
          Press &amp; hold the image, then tap{' '}
          <span className="text-brass font-bold">Save to Photos</span>
        </div>

        <div className="mt-4 w-full rounded-2xl overflow-hidden border border-brass/40 shadow-[0_20px_60px_rgba(0,0,0,0.6)] bg-bg">
          <img
            src={src}
            alt="Bakra Party invite"
            className="block w-full h-auto select-text"
            style={{ touchAction: 'manipulation', WebkitTouchCallout: 'default' }}
          />
        </div>

        <a
          href={src}
          download={filename}
          className="mt-4 text-[11px] uppercase tracking-[0.28em] text-parchment/70 underline underline-offset-4 font-bold"
        >
          or tap to download
        </a>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="mt-3 px-5 min-h-[44px] rounded-xl border border-parchment/25 text-parchment/85 text-[12px] uppercase tracking-[0.25em] font-bold active:bg-parchment/10"
        >
          Close
        </button>
      </div>
    </div>
  );
}
