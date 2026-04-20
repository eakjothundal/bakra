import { useEffect, useState } from 'react';
import { buildInviteImage } from '../lib/buildInviteImage';

interface Props {
  open: boolean;
  onClose: () => void;
}

const HERO_SRC = `${import.meta.env.BASE_URL}hero-eakjot.png`;

export function SaveInviteModal({ open, onClose }: Props) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || imageUrl) return;
    let cancelled = false;
    setError(null);
    buildInviteImage(HERO_SRC)
      .then((url) => {
        if (cancelled) URL.revokeObjectURL(url);
        else setImageUrl(url);
      })
      .catch((e) => {
        if (!cancelled) setError(e?.message ?? 'Failed to build invite');
      });
    return () => {
      cancelled = true;
    };
  }, [open, imageUrl]);

  useEffect(() => {
    return () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl);
    };
  }, [imageUrl]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="save-invite-title"
      className="fixed inset-0 z-[60] flex items-center justify-center bg-bg/90 backdrop-blur-sm px-5 py-6 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[360px] rounded-2xl border border-brass/30 bg-bg p-5 shadow-[0_12px_30px_rgba(0,0,0,0.6)] my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute -top-3 -right-3 w-9 h-9 rounded-full bg-black border border-brass/50 flex items-center justify-center text-parchment text-lg shadow-[0_4px_10px_rgba(0,0,0,0.5)] active:scale-95"
        >
          <span aria-hidden>✕</span>
        </button>

        <h3
          id="save-invite-title"
          className="display-headline text-center"
          style={{ fontSize: 'clamp(20px, 5.5vw, 26px)' }}
        >
          SAVE THE INVITE
        </h3>
        <p className="mt-2 text-center text-[10px] tracking-[0.28em] uppercase text-parchment/70">
          press &amp; hold the image to save
        </p>

        <div className="mt-4 rounded-xl overflow-hidden border border-brass/25 bg-black/30 aspect-[9/16] flex items-center justify-center">
          {error ? (
            <div className="text-xs text-rust p-4 text-center">{error}</div>
          ) : imageUrl ? (
            <img
              src={imageUrl}
              alt="Bakra Party invite"
              className="block w-full h-auto select-none"
              style={{ WebkitTouchCallout: 'default' }}
            />
          ) : (
            <div className="text-[10px] tracking-[0.28em] uppercase text-parchment/60">
              preparing invite…
            </div>
          )}
        </div>

        <p className="mt-3 text-center text-[10px] tracking-[0.24em] uppercase text-parchment/55">
          tap outside to close
        </p>
      </div>
    </div>
  );
}
