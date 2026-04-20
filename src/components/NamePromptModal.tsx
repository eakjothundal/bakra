import { useState } from 'react';
import { normalizeName } from '../lib/identity';

interface Props {
  onSubmit: (name: string) => void;
}

export function NamePromptModal({ onSubmit }: Props) {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = normalizeName(value);
    if (!normalized) {
      setError('1–20 characters, please.');
      return;
    }
    onSubmit(normalized);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-bg/85 backdrop-blur-sm px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="name-prompt-title"
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-[320px] rounded-2xl border border-brass/30 bg-bg p-6 shadow-[0_12px_30px_rgba(0,0,0,0.6)]"
      >
        <h3
          id="name-prompt-title"
          className="display-headline text-center"
          style={{ fontSize: 'clamp(22px, 6vw, 28px)' }}
        >
          NAME YOUR GOAT
        </h3>
        <p className="mt-2 text-center text-[11px] tracking-[0.3em] uppercase text-parchment/70">
          saved on this device · shown on the leaderboard
        </p>
        <input
          autoFocus
          type="text"
          maxLength={40}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (error) setError(null);
          }}
          placeholder="Bibek"
          className="mt-5 w-full rounded-lg border border-brass/40 bg-parchment/5 px-3 py-3 text-[16px] text-parchment outline-none focus:border-brass"
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? 'name-error' : undefined}
        />
        {error && (
          <div id="name-error" className="mt-2 text-[12px] text-rust">
            {error}
          </div>
        )}
        <button type="submit" className="btn-western mt-5">
          Save &amp; Submit
        </button>
      </form>
    </div>
  );
}
