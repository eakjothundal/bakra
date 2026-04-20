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
5. **Name prompt timing.** Modal overlay on the `gameOver` screen, shown **only** when the run qualifies (score ≥ 3) AND `bakra:playerName` is not set. The modal blocks submission; on modal submit, the score is submitted (if it beats local PB) and the appropriate screen transition fires. After that, the name is reused silently forever.
6. **#1 celebration screen.** When the client detects (via a post-submit leaderboard fetch) that the player is now at rank 1, insert a dedicated celebration screen **before** the `gameOver` screen. It reuses the medal + confetti + rays visual structure from the old `WonScreen`, rebranded as "🏆 NEW #1 GOAT". A single "Continue" button routes to `gameOver` (which contains the full leaderboard inline). All other submits go straight to `gameOver`.
7. **Leaderboard display.** Top 10 visible, scrollable for more. Each row shows: rank + character emoji + name + score. Global across all characters. Sort: `score DESC, updatedAt ASC` (earliest submitter wins ties). The current player's row is highlighted.
8. **Infra.** Netlify Functions + DynamoDB + IAM user (scoped policy). No AWS API Gateway, no Lambda, no Cognito.
9. **No auth, no rate limiting.** Justified by audience (family/friends invite, not public). Backend validation covers bad input. If abuse ever materializes, Cloudflare Rate Limiting Rules on the free plan can be added without code changes.
10. **Delete the card concept entirely.** `CardScreen.tsx`, `TradingCard.tsx`, `downloadCard.ts`, `WonScreen.tsx`, and the "Download Static Invite (Uncles)" button are all removed.

## User Flow

**Screen-level routing (handled by `App.tsx`):**

```
invite ─ Play ─▶ select ─ Confirm ─▶ game ─ collision ─▶ gameOver
   │                                                        │
   │  View Leaderboard                        (optional) firstPlace ─▶ gameOver
   └───────▶ leaderboard ─ Back ─▶ invite                   │
                                                     Play Again / Back to Invite
```

**Post-game orchestration (runs when `game` screen dispatches `onGameEnd(score)`):**

```
1. Route to `gameOver` immediately with { score }.
2. If score < 3:
     gameOver renders "need 3+" state. No submit, no modal. Done.
3. Else (score ≥ 3):
     a. Ensure playerId exists (create UUID + persist if missing).
     b. If playerName missing:
          gameOver renders NamePromptModal blocking the main content.
          User submits name → persist → continue step c.
        Else: continue step c directly.
     c. If score > personalBest:
          Call submit-score. On accepted: update local PB to score.
          On rejected (server had higher): sync local PB ← serverScore.
          On network error: toast, keep local PB = score (optimistic), continue.
        Else: skip submit entirely.
     d. Fetch leaderboard. If the current playerId is rank 1 AND the
        submit was accepted this run, route to `firstPlace` screen
        (which routes back to `gameOver` on Continue). Otherwise
        stay on `gameOver` and render the leaderboard inline.
```

- **`invite`** gains a small secondary "View Leaderboard" link under the Play button.
- **`leaderboard`** is a standalone screen (reachable from invite). Contains a Back button that routes to `invite`.
- **`gameOver`** replaces both `WonScreen` and `CardScreen`. Always shows: your score, your all-time best, the top 10 leaderboard with your row highlighted, "Play Again" button (routes to `select`), and "Back to Invite" link.
- **`firstPlace`** is a full-screen celebration shown only when the player is rank 1 after a successful submit. Single "Continue" button routes to `gameOver`.
- **Name prompt** is a modal rendered inside `gameOver`, not its own screen.

## Data Model

### DynamoDB table: `bakra-party-scores`

| Attribute | Type | Description |
|---|---|---|
| `playerId` (PK) | String | v4 UUID from client localStorage |
| `name` | String | Display name, 1–20 chars, trimmed |
| `character` | String | `eakjot` \| `abel` \| `astro` — character used when the current best score was set (see "Character field semantics") |
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
  - `name` is a string. Normalization order: strip control chars (`/[\x00-\x1F\x7F]/g`) → `trim()` → check `length >= 1 && length <= 20`. The **same** normalization runs in `NamePromptModal` before the client submits, so client-side and server-side rules cannot drift.
  - `character` is in `['eakjot', 'abel', 'astro']`.
  - `score` is an integer, `3 ≤ score ≤ 10000` (defensive upper bound).
- Performs `UpdateItem` with:
  - Key: `{ playerId }`
  - `UpdateExpression: SET #n = :name, #c = :character, score = :newScore, updatedAt = :ts`
  - `ConditionExpression: attribute_not_exists(score) OR score < :newScore`
- On success: `200` with `{ accepted: true, newScore }`.
- On `ConditionalCheckFailedException`: `GetItem` to read the current score and return `200` with `{ accepted: false, serverScore }`.
- On other errors: `500`.
- **Rank is NOT computed in this function.** The client detects "am I #1?" by calling `get-leaderboard` after a successful submit and checking whether the returned top entry's `playerId` matches the current player. One DDB round-trip per submit; rank detection is a cheap second call the client was going to make anyway (the gameOver screen needs leaderboard data).

### Client → function URL convention

Frontend fetches from `/.netlify/functions/get-leaderboard` and `/.netlify/functions/submit-score` directly. No redirect layer. The existing `netlify.toml` SPA catch-all (`/*` → `/index.html`) does not shadow function routes because Netlify resolves `/.netlify/functions/*` before user redirects. No change to `netlify.toml` required.

### Response headers

- `Content-Type: application/json`.
- No CORS headers needed (same-origin: frontend and functions are served by the same Netlify site).

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
- `src/components/StaticInvite.tsx` (the static-invite download is also being removed)
- `src/lib/downloadCard.ts`

### Dependencies

- **Add:** `@aws-sdk/client-dynamodb`, `@aws-sdk/lib-dynamodb`, `uuid` (+ `@types/uuid`).
- **Remove:** `html2canvas` (only consumer was `downloadCard.ts`).

### Files to modify

- **`src/types.ts`** — remove `'card'` and `'won'` from the `Screen` union; add `'gameOver'`, `'leaderboard'`, `'firstPlace'`. Add shared types: `PlayerIdentity`, `LeaderboardEntry`, `SubmitScoreResponse`.
- **`src/App.tsx`** — remove the `WonScreen`, `CardScreen`, and `StaticInvite` imports and render paths. Add routes for `'gameOver'`, `'leaderboard'`, `'firstPlace'`. Rename `GameScreen`'s `onWin` callsite to `onGameEnd(score)` and wire it to the post-game orchestrator.
- **`src/game/FlappyBakra.tsx`** — delete `WIN_SCORE` import and win-branch logic (lines ~140–146, ~193–207). Single `gameover` terminal state triggered by any collision. Rename `onWin` → `onGameEnd(score: number)` and invoke with the final score on collision. Replace the waiting-overlay subtitle "dodge 3 pipes to unlock the card" with "how high can you fly?" (or similar — final copy at implementation). Remove the "unlocking your rookie card…" overlay entirely.
- **`src/game/renderer.ts`** — remove the `WIN_SCORE` export.
- **`src/screens/GameScreen.tsx`** — rename prop `onWin` → `onGameEnd(score)`. Remove the "target: 3" label under the score counter.
- **`src/screens/InviteScreen.tsx`** — add a secondary "View Leaderboard" link under the primary Play button. Replace the existing subtitle string `'tap around for goat rain · pass 3 pipes to unlock your card'` (line ~231 in current source) with post-card copy (e.g., `'tap around for goat rain · flap your way onto the leaderboard'`).

### Files to create

- **`src/lib/identity.ts`** — `getOrCreatePlayerId()`, `getPlayerName()`, `setPlayerName(name)`, `getPersonalBest()`, `setPersonalBest(n)`, `getLastCharacter()`, `setLastCharacter(c)`. All read/write the namespaced localStorage keys. Thin, pure functions.
- **`src/lib/leaderboardApi.ts`** — `fetchLeaderboard()`, `submitScore(params)`. Wraps `fetch` to the Netlify functions. Returns typed results, normalizes errors.
- **`src/hooks/useLeaderboard.ts`** — `useLeaderboard()` hook returning `{ entries, loading, error, refetch }`. Fetches on mount.
- **`src/screens/GameOverScreen.tsx`** — the new terminal screen. Props: `{ score, personalBest, isNewBest, submitStatus, character, onPlayAgain, onBackToInvite, sound }`. Renders score, PB badge, leaderboard (with current player highlighted), play-again + back buttons. Renders `NamePromptModal` when `playerName` is missing and `score >= 3`.
- **`src/screens/LeaderboardScreen.tsx`** — standalone leaderboard view reachable from invite. Props: `{ onBack: () => void }`. Renders a heading, the `<Leaderboard />` component (using `useLeaderboard`), and a back button that calls `onBack` (wired to `setScreen('invite')`).
- **`src/screens/FirstPlaceScreen.tsx`** — the #1 celebration screen. Ports the medal + confetti + rays markup from the deleted `WonScreen` with updated copy ("🏆 NEW #1 GOAT") and intensified animation. Single "Continue" button calls `onContinue` → `gameOver`.
- **`src/components/Leaderboard.tsx`** — presentational top-N table. Props: `{ entries, highlightPlayerId, loading }`. Renders rank + char emoji + name + score rows, scrolls after N=10 visible.
- **`src/components/NamePromptModal.tsx`** — overlay modal. Validates 1–20 chars, trims, strips control chars. On submit, calls `onSubmit(name)` which triggers the score submit flow.

### Orchestration in `App.tsx`

`GameScreen.onGameEnd(score)` triggers the orchestrator already defined in the User Flow section. Two implementation notes:

- The orchestrator stores interim state (`lastScore`, `lastSubmitAccepted`, `lastRankOne`) in `App.tsx` state so `GameOverScreen` and `FirstPlaceScreen` can render without prop-drilling from elsewhere.
- The leaderboard fetched during the orchestrator is cached in app state and passed to `GameOverScreen` so it doesn't re-fetch on mount immediately after. `useLeaderboard()` accepts an optional `initialEntries` so the embedded leaderboard renders instantly, with an automatic refresh on mount (non-blocking) for long-open sessions.

### Character field semantics

Because the `UpdateItem` writes `score` and `character` together inside the same conditional expression (`attribute_not_exists(score) OR score < :newScore`), `character` is only overwritten when the score is actually improved. In other words: **the `character` column reflects the character the player used to set their current best score**, not whatever they picked most recently. The leaderboard's "rank + emoji + name + score" display is therefore faithful.

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
