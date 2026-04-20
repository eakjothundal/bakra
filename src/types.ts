export type Screen =
  | 'loading'
  | 'invite'
  | 'select'
  | 'game'
  | 'leaderboard'
  | 'gameOver'
  | 'firstPlace';

export type Character = 'eakjot' | 'abel' | 'astro';

export interface PlayerIdentity {
  playerId: string;
  name: string | null;
}

export interface LeaderboardEntry {
  playerId: string;
  name: string;
  character: Character;
  score: number;
  updatedAt: number;
}

export type SubmitScoreResponse =
  | { accepted: true; newScore: number }
  | { accepted: false; serverScore: number };
