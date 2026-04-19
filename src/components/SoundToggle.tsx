import type { UseSound } from '../hooks/useSound';

export function SoundToggle({ sound }: { sound: UseSound }) {
  return (
    <button
      type="button"
      onClick={sound.toggle}
      aria-label={sound.enabled ? 'Mute sound effects' : 'Enable sound effects'}
      aria-pressed={sound.enabled}
      className="fixed z-50 w-11 h-11 rounded-full bg-black/50 border border-brass/50 flex items-center justify-center text-xl backdrop-blur-sm active:scale-95 transition-transform shadow-[0_4px_10px_rgba(0,0,0,0.5)]"
      style={{
        top: 'calc(env(safe-area-inset-top, 0px) + 12px)',
        right: 'calc(env(safe-area-inset-right, 0px) + 12px)',
      }}
    >
      <span aria-hidden>{sound.enabled ? '🔊' : '🔇'}</span>
    </button>
  );
}
