import { useCallback, useEffect, useRef, useState } from 'react';
import * as Tone from 'tone';
import { sounds, type SoundName } from '../lib/sounds';

const STORAGE_KEY = 'bakra:sound';

export function useSound() {
  const [enabled, setEnabled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(STORAGE_KEY) === 'on';
  });
  const unlocked = useRef(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, enabled ? 'on' : 'off');
  }, [enabled]);

  const unlock = useCallback(async () => {
    if (unlocked.current) return;
    try {
      await Tone.start();
      unlocked.current = true;
    } catch {
      // ignore
    }
  }, []);

  const play = useCallback(
    (name: SoundName) => {
      if (!enabled) return;
      if (Tone.context.state !== 'running') {
        void Tone.start();
      }
      try {
        sounds[name]();
      } catch {
        // swallow
      }
    },
    [enabled],
  );

  const toggle = useCallback(() => {
    setEnabled((prev) => {
      const next = !prev;
      if (next) void Tone.start();
      return next;
    });
  }, []);

  return { enabled, play, toggle, unlock };
}

export type UseSound = ReturnType<typeof useSound>;
