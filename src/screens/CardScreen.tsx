import { useState } from 'react';
import { TradingCard } from '../components/TradingCard';
import { downloadElement } from '../lib/downloadCard';
import type { UseSound } from '../hooks/useSound';

interface Props {
  onBack: () => void;
  sound: UseSound;
}

type ToastState = null | { msg: string; tone: 'info' | 'success' | 'error' };

export function CardScreen({ onBack, sound }: Props) {
  const [toast, setToast] = useState<ToastState>(null);
  const [busy, setBusy] = useState<'card' | 'invite' | null>(null);

  const showToast = (msg: string, tone: 'info' | 'success' | 'error' = 'info') => {
    setToast({ msg, tone });
    window.setTimeout(() => setToast(null), 2200);
  };

  const handleDownloadCard = async () => {
    if (busy) return;
    sound.play('tap');
    setBusy('card');
    showToast('generating card…', 'info');
    try {
      await downloadElement(
        'trading-card-download',
        'eakjot-bakra-party-rookie-card.png',
        { background: '#1a1410', scale: 3 },
      );
      showToast('card saved!', 'success');
    } catch {
      showToast('download failed', 'error');
    } finally {
      setBusy(null);
    }
  };

  const handleDownloadInvite = async () => {
    if (busy) return;
    sound.play('tap');
    setBusy('invite');
    showToast('generating invite…', 'info');
    try {
      await downloadElement('static-invite', 'bakra-party-invite.png', {
        background: '#F4E8D0',
        scale: 2,
      });
      showToast('invite saved!', 'success');
    } catch {
      showToast('download failed', 'error');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="relative min-h-dvh w-full max-w-app mx-auto px-6 pt-10 pb-10 flex flex-col">
      <div className="text-center">
        <div className="text-[10px] tracking-[0.45em] uppercase text-brass font-black">
          ◈ Certified Goat ◈
        </div>
        <h2
          className="display-headline mt-2"
          style={{ fontSize: 'clamp(28px, 8vw, 36px)' }}
        >
          YOUR CARD
        </h2>
      </div>

      <div className="mt-8 flex justify-center">
        {/* Hidden clone optimized for export (no notches) */}
        <div style={{ position: 'absolute', left: -99999, top: 0 }} aria-hidden>
          <TradingCard forDownload id="trading-card-download" />
        </div>
        {/* Visible card */}
        <TradingCard id="trading-card-visible" />
      </div>

      <div className="mt-8 space-y-3">
        <button
          type="button"
          onClick={handleDownloadCard}
          disabled={busy !== null}
          className="btn-western"
        >
          {busy === 'card' ? 'Generating…' : '↓ Download My Card'}
        </button>
        <button
          type="button"
          onClick={handleDownloadInvite}
          disabled={busy !== null}
          className="btn-outline"
        >
          {busy === 'invite' ? 'Generating…' : '↓ Static Invite (Uncles)'}
        </button>
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to invite"
          className="mt-2 mx-auto text-[12px] text-parchment/75 underline underline-offset-4 block min-h-[44px] px-4 rounded-lg active:bg-parchment/5"
        >
          ← back to invite
        </button>
      </div>

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={[
            'fixed left-1/2 -translate-x-1/2 bottom-6 px-4 py-3 rounded-xl text-[13px] font-medium shadow-lg',
            toast.tone === 'success'
              ? 'bg-brass text-bg'
              : toast.tone === 'error'
                ? 'bg-rust text-parchment'
                : 'bg-parchment/10 text-parchment border border-brass/30',
          ].join(' ')}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}
