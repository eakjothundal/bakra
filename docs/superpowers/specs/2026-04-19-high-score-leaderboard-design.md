# High-Score Leaderboard Design

**Date:** 2026-04-19
**Status:** Approved for implementation
**Replaces:** Card reveal / trading-card concept

## Problem

The current end-of-game flow awards a downloadable "rookie card" after clearing 3 pipes. The win target is fixed at 3, so every player's "score" is identical and there is no ongoing reason to replay. The card concept also adds a screen (`CardScreen`), a component (`TradingCard`), and a download helper (`downloadCard.ts`) that will be removed.

We want to replace this with a global, persistent high-score leaderboard so guests of the event have a reason to compete and replay.

## Design Decisions

1. **Game becomes endless.** Remove the `WIN_SCORE=3` short-circuit in `FlappyBakra.tsx`. The game ends only on collision (floor, ceiling, or pipe). Score keeps incrementing per pipe cleared.
2. **Minimum score to submit is 3.** Runs that end with score ≤ 2 do not touch the leaderboard. The Game Over screen shows the score and a friendly "need 3+ to make the board" message.
3. **Identity model.** Each player has two values:
   - **`playerId`** — v4 UUID generated client-side on first qualifying run, stored in `localStorage`. This is the DynamoDB partition key.
   - **`name`** — free-form display string entered in the name prompt modal, 1–20 chars after trim, control chars stripped. Collisions are allowed (two "Bibek"s coexist, distinguished by playerId in the DB).
4. **Hybrid write gating.**
   - **Client gate:** skip the `submit-score` network call if the run's score is not strictly greater than `bakra:personalBest` in localStorage.
   - **Server gate (authoritative):** the `submit-score` Lambda/Netlify function uses a DynamoDB conditional `UpdateItem` (`attribute_not_exists(score) OR score < :newScore`). If a cleared localStorage caused a submit with a score lower than the stored best, the conditional write rejects it and the response carries the real server score so the client can heal its local cache.
   - On app load (or leaderboard fetch), sync `bakra:personalBest ← max(local, server)`.
5. **Name prompt timing.** Modal overlay on the `gameOver` screen, shown **only** the first qualifying run (score ≥ 3) when `bakra:playerName` is not set. After that, the name is reused silently forever.
6. **#1 celebration screen.** When a submit response indicates the player took the top rank, insert a dedicated celebration screen **before** the `gameOver` screen. It reuses the medal + confetti + rays visual structure from the old `WonScreen`, rebranded as "🏆 NEW #1 GOAT". A single button continues to `gameOver`. All other submits go straight to `gameOver`.
7. **Leaderboard display.** Top 10 visible, scrollable for more. Each row shows: rank + character emoji + name + score. Global across all characters. Sort: `score DESC, updatedAt ASC` (earliest submitter wins ties). The current player's row is highlighted.
8. **Infra.** Netlify Functions + DynamoDB + IAM user (scoped policy). No AWS API Gateway, no Lambda, no Cognito.
9. **No auth, no rate limiting.** Justified by audience (family/friends invite, not public). Backend validation covers bad input. If abuse ever materializes, Cloudflare Rate Limiting Rules on the free plan can be added without code changes.
10. **Delete the card concept entirely.** `CardScreen.tsx`, `TradingCard.tsx`, `downloadCard.ts`, `WonScreen.tsx`, and the "Download Static Invite (Uncles)" button are all removed.

## User Flow

```
invite ─ Play ─▶ select ─ Confirm ─▶ game
   │                                   │
   │  View                   ┌─────────┴──────────┐
   │  Leaderboard            │                    │
   └───────────▶ leaderboard die, score < 3   die, score ≥ 3
                                 │                    │
                                 ▼                    ▼
                              gameOver          first time ever?
                            (no submit)         ├─yes─▶ name prompt
                                                │        │
                                                └─no─────┤
                                                         ▼
                                           beats local PB?
                                                         │
                                                yes──────┤──────no
                                                 │       │        │
                                                 ▼       │        ▼
                                          submit-score   │   gameOver
                                                 │       │   (no submit,
                                           accepted +    │    show leaderboard)
                                           became #1?    │
                                              │          │
                                   yes───────┤          │
                                    │        │          │
                                    ▼        │          │
                          #1 celebration     │          │
                            screen           │          │
                                    │        │          │
                                    └────────┴──────────┴───▶ gameOver
```

- **`invite`** gains a small secondary "View Leaderboard" link under the Play button.
- **`leaderboard`** is a new standalone screen (viewable without playing) and also renders inside `gameOver`.
- **`gameOver`** replaces both `WonScreen` and `CardScreen`. Always shows: your score, your all-time best, the top 10 leaderboard with your row highlighted, "Play Again" button, and "Back to Invite" link.
- **Name prompt** is a modal, not a screen.

## Data Model

### DynamoDB table: `bakra-party-scores`

| Attribute | Type | Description |
|---|---|---|
| `playerId` (PK) | String | v4 UUID from client localStorage |
| `name` | String | Display name, 1–20 chars, trimmed |
| `character` | String | `eakjot` \| `abel` \| `astro` (most recent pick) |
| `score` | Number | All-time best |
| `updatedAt` | Number | Epoch ms, tiebreak on display (ASC = earliest wins) |

- Billing mode: **on-demand** (free tier covers this party-scale traffic).
- No GSIs. Leaderboard fetch is a `Scan` with `Limit=100` (defensive cap; realistic row count is dozens).
- No TTL. Scores are permanent for the event.

### localStorage keys (namespaced `bakra:`)

| Key | Value | Lifecycle |
|---|---|---|
| `bakra:playerId` | UUID string | Created lazily on first qualifying run |
| `bakra:playerName` | String | Set by name prompt modal |
| `bakra:personalBest` | Number (stringified) | Synced from server on load; updated on every accepted submit |
| `bakra:lastCharacter` | String | Set when a character is confirmed on select screen |

The existing `useFirstVisit` hook uses its own key and is untouched.

## Backend (Netlify Functions)

Both functions live in `netlify/functions/` and use `@aws-sdk/client-dynamodb` + `@aws-sdk/lib-dynamodb`.

### `get-leaderboard.ts` — GET

- No query params.
- Performs `Scan` on the table with `Limit: 100` and projection expression restricting to `playerId, name, character, score, updatedAt`.
- Sorts in-memory by `score DESC, updatedAt ASC`.
- Response: `200` with `{ entries: LeaderboardEntry[] }`.
- Cache header: `Cache-Control: public, max-age=10, s-maxage=10`.
- On DDB error: `500` with `{ error: 'failed to fetch leaderboard' }`.

### `submit-score.ts` — POST

- Request body (JSON): `{ playerId, name, character, score }`.
- **Validation** (return `400` with `{ error }` on any failure):
  - `playerId` matches v4 UUID regex.
  - `name` is a string, 1–20 chars after `trim()`, with control chars (`/[\x00-\x1F\x7F]/`) stripped.
  - `character` is in `['eakjot', 'abel', 'astro']`.
  - `score` is an integer, `3 ≤ score ≤ 10000` (defensive upper bound).
- Performs `UpdateItem` with:
  - Key: `{ playerId }`
  - `UpdateExpression: SET #n = :name, #c = :character, score = :newScore, updatedAt = :ts`
  - `ConditionExpression: attribute_not_exists(score) OR score < :newScore`
- On success: `200` with `{ accepted: true, newScore, rank }` where `rank` is recomputed by a follow-up `Scan` + sort to detect whether the player is now #1.
- On `ConditionalCheckFailedException`: `GetItem` to read the current score and return `200` with `{ accepted: false, serverScore }`.
- On other errors: `500`.

### Infra setup (one-time, manual)

1. **Create DynamoDB table** `bakra-party-scores` in your chosen region (e.g., `us-east-1`). Partition key: `playerId` (String). Billing: On-Demand. No sort key, no GSI.
2. **Create IAM user** `bakra-party-netlify` with an inline policy restricted to `dynamodb:GetItem`, `dynamodb:UpdateItem`, `dynamodb:Scan` on the single table ARN. Generate access key + secret.
3. **Add Netlify environment variables** (Site settings → Environment variables):
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `AWS_REGION`
   - `DDB_TABLE_NAME`
4. A short `docs/aws-setup.md` documents the above for reproducibility.

## Frontend Changes

### Files to delete

- `src/screens/CardScreen.tsx`
- `src/screens/WonScreen.tsx`
- `src/components/TradingCard.tsx`
- `src/lib/downloadCard.ts`

### Files to modify

- **`src/types.ts`** — remove `'card'` and `'won'` from the `Screen` union; add `'gameOver'`, `'leaderboard'`, `'firstPlace'`. Add shared types: `PlayerIdentity`, `LeaderboardEntry`, `SubmitScoreResponse`.
- **`src/App.tsx`** — remove routes for `'won'` and `'card'`; add routes for `'gameOver'`, `'leaderboard'`, `'firstPlace'`. Wire `GameScreen`'s `onGameEnd(score)` to orchestrate submit + routing.
- **`src/game/FlappyBakra.tsx`** — delete `WIN_SCORE` logic. Single `gameover` terminal state triggered by any collision. Rename `onWin` → `onGameEnd(score: number)`. Remove the victory-delay branch and the "unlocking your rookie card…" overlay.
- **`src/game/renderer.ts`** — remove the `WIN_SCORE` import / export.
- **`src/screens/GameScreen.tsx`** — rename prop `onWin` → `onGameEnd(score)`. Remove the "target: 3" label under the score counter.
- **`src/screens/InviteScreen.tsx`** — add a secondary "View Leaderboard" link under the primary Play button.

### Files to create

- **`src/lib/identity.ts`** — `getOrCreatePlayerId()`, `getPlayerName()`, `setPlayerName(name)`, `getPersonalBest()`, `setPersonalBest(n)`, `getLastCharacter()`, `setLastCharacter(c)`. All read/write the namespaced localStorage keys. Thin, pure functions.
- **`src/lib/leaderboardApi.ts`** — `fetchLeaderboard()`, `submitScore(params)`. Wraps `fetch` to the Netlify functions. Returns typed results, normalizes errors.
- **`src/hooks/useLeaderboard.ts`** — `useLeaderboard()` hook returning `{ entries, loading, error, refetch }`. Fetches on mount.
- **`src/screens/GameOverScreen.tsx`** — the new terminal screen. Props: `{ score, personalBest, isNewBest, submitStatus, character, onPlayAgain, onBackToInvite, sound }`. Renders score, PB badge, leaderboard (with current player highlighted), play-again + back buttons. Renders `NamePromptModal` when `playerName` is missing and `score >= 3`.
- **`src/screens/LeaderboardScreen.tsx`** — standalone leaderboard view reachable from invite. Reuses `<Leaderboard />` component.
- **`src/screens/FirstPlaceScreen.tsx`** — the #1 celebration screen. Ports the medal + confetti + rays markup from the deleted `WonScreen` with updated copy ("🏆 NEW #1 GOAT") and intensified animation. Single "View Leaderboard" button calls `onContinue` → `gameOver`.
- **`src/components/Leaderboard.tsx`** — presentational top-N table. Props: `{ entries, highlightPlayerId, loading }`. Renders rank + char emoji + name + score rows, scrolls after N=10 visible.
- **`src/components/NamePromptModal.tsx`** — overlay modal. Validates 1–20 chars, trims, strips control chars. On submit, calls `onSubmit(name)` which triggers the score submit flow.

### Orchestration in `App.tsx`

`GameScreen.onGameEnd(score)` runs a small async orchestrator:

1. If `score < 3` → `setScreen('gameOver')`, no submit.
2. Else, ensure `playerId` exists (create if missing). If `playerName` missing → route to `gameOver` which shows the name modal; modal's `onSubmit` continues with step 3.
3. If `score > personalBest` → call `submitScore(...)`. Update local PB on accepted response, or sync up from `serverScore` if rejected.
4. If response indicates `rank === 1` → route to `firstPlace` first, then `gameOver`. Else → `gameOver` directly.

## Edge Cases

- **Offline / network failure during submit** → show a small toast on `gameOver` ("couldn't save your score — still leaderboard-worthy though"). Local PB is still updated (we trust the local run happened). Next successful submit will catch up.
- **localStorage unavailable** (private mode, etc.) → each call to identity.ts wraps in try/catch. Missing `playerId` generates a fresh one per session (scores will be anonymous-ish). The app degrades gracefully; nothing crashes.
- **Name with only whitespace** → validation rejects before submit. Modal re-prompts.
- **Score of exactly 3 on a first run with no prior PB** → submit goes through, becomes personal best, may or may not become #1 depending on server state.
- **Two players on same device with different names** → second player can overwrite `bakra:playerName` via an "edit name" affordance on the leaderboard (out of scope for v1 — one player per device assumed).
- **DynamoDB transient error on submit** → client shows a "try again" toast on `gameOver`; state is recoverable.

## Testing

- **Unit:** `identity.ts` localStorage wrappers (happy path + try/catch). Name validation in `NamePromptModal` and on the backend.
- **Integration:** `leaderboardApi.ts` against a mocked `fetch`. Submit flow in `App.tsx` orchestrator with mocked API — covers `score < 3`, beats PB, doesn't beat PB, server rejects, becomes #1, doesn't become #1.
- **Manual:** full flow in browser — first visit, name prompt, subsequent visits auto-submit, clearing localStorage triggers server heal, #1 celebration triggers.

## Out of Scope (v1)

- Profanity filter on names.
- Rate limiting (add only if abuse observed).
- Edit-name-later UI.
- Per-character leaderboards.
- Real auth / login.
- Pagination beyond the scan limit (100 is more than enough for a party).
- Push notifications when someone beats your score.
