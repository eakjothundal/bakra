import * as Tone from 'tone';

type SoundName = 'flap' | 'score' | 'death' | 'victory' | 'tap';

function withSynth<T extends Tone.Synth | Tone.MonoSynth>(
  synth: T,
  run: (s: T) => void,
) {
  run(synth);
  setTimeout(() => synth.dispose(), 2500);
}

export const sounds: Record<SoundName, () => void> = {
  flap: () => {
    const s = new Tone.Synth({
      oscillator: { type: 'square' },
      envelope: { attack: 0.005, decay: 0.05, sustain: 0, release: 0.05 },
      volume: -12,
    }).toDestination();
    withSynth(s, (sy) => sy.triggerAttackRelease('G5', '32n'));
  },
  score: () => {
    const s = new Tone.Synth({
      oscillator: { type: 'square' },
      envelope: { attack: 0.005, decay: 0.1, sustain: 0, release: 0.1 },
      volume: -10,
    }).toDestination();
    s.triggerAttackRelease('C6', '16n');
    setTimeout(() => s.triggerAttackRelease('E6', '16n'), 80);
    setTimeout(() => s.dispose(), 1000);
  },
  death: () => {
    const s = new Tone.Synth({
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.01, decay: 0.3, sustain: 0.2, release: 0.4 },
      volume: -14,
    }).toDestination();
    s.triggerAttackRelease('A3', '8n');
    setTimeout(() => s.triggerAttackRelease('E3', '4n'), 150);
    setTimeout(() => s.dispose(), 1500);
  },
  victory: () => {
    const s = new Tone.Synth({
      oscillator: { type: 'square' },
      volume: -10,
    }).toDestination();
    const notes: Array<Tone.Unit.Note> = ['C5', 'E5', 'G5', 'C6'];
    notes.forEach((note, i) =>
      setTimeout(() => s.triggerAttackRelease(note, '16n'), i * 120),
    );
    setTimeout(() => s.dispose(), 1500);
  },
  tap: () => {
    const s = new Tone.Synth({
      oscillator: { type: 'sine' },
      envelope: { attack: 0.005, decay: 0.03, sustain: 0, release: 0.01 },
      volume: -20,
    }).toDestination();
    withSynth(s, (sy) => sy.triggerAttackRelease('C5', '64n'));
  },
};

export type { SoundName };
