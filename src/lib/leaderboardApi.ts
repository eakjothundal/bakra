import type { Character, LeaderboardEntry, SubmitScoreResponse } from '../types';

const GET_URL = '/.netlify/functions/get-leaderboard';
const SUBMIT_URL = '/.netlify/functions/submit-score';

export async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  try {
    const res = await fetch(GET_URL);
    if (!res.ok) return [];
    const body = (await res.json()) as { entries?: LeaderboardEntry[] };
    return body.entries ?? [];
  } catch {
    return [];
  }
}

export interface SubmitScoreParams {
  playerId: string;
  name: string;
  character: Character;
  score: number;
}

export async function submitScore(params: SubmitScoreParams): Promise<SubmitScoreResponse> {
  const res = await fetch(SUBMIT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(`submitScore ${res.status}`);
  return (await res.json()) as SubmitScoreResponse;
}
