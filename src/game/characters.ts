import type { Character } from '../types';

export interface CharacterConfig {
  name: string;
  descriptor: string;
  sprite: string;
  emoji: string;
  physics: {
    gravity: number;
    flap: number;
    terminalVelocity: number;
  };
}

export const CHARACTERS: Record<Character, CharacterConfig> = {
  eakjot: {
    name: 'Eakjot',
    descriptor: 'the groom · balanced flight',
    sprite: 'assets/sprite-eakjot.png',
    emoji: '🐐',
    physics: { gravity: 0.45, flap: -7.8, terminalVelocity: 10 },
  },
  abel: {
    name: 'Abel',
    descriptor: 'the pit/lab · heavy hitter',
    sprite: 'assets/sprite-abel.png',
    emoji: '🐕',
    physics: { gravity: 0.55, flap: -9.5, terminalVelocity: 12 },
  },
  astro: {
    name: 'Astro',
    descriptor: 'the maltipoo · floaty & fast',
    sprite: 'assets/sprite-astro.png',
    emoji: '🐩',
    physics: { gravity: 0.35, flap: -6.2, terminalVelocity: 8 },
  },
};

export const CHARACTER_ORDER: Character[] = ['eakjot', 'abel', 'astro'];
