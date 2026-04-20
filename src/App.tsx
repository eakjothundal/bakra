import { useCallback, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { Character, LeaderboardEntry, Screen } from './types';
import { useFirstVisit } from './hooks/useFirstVisit';
import { useSound } from './hooks/useSound';
import { LoadingScreen } from './screens/LoadingScreen';
import { InviteScreen } from './screens/InviteScreen';
import { CharacterSelectScreen } from './screens/CharacterSelectScreen';
import { GameScreen } from './screens/GameScreen';
import { GameOverScreen, type SubmitStatus } from './screens/GameOverScreen';
import { FirstPlaceScreen } from './screens/FirstPlaceScreen';
import { LeaderboardScreen } from './screens/LeaderboardScreen';
import { SoundToggle } from './components/SoundToggle';
import {
  getOrCreatePlayerId,
  getPlayerName,
  setPlayerName,
  getPersonalBest,
  setPersonalBest,
  setLastCharacter,
} from './lib/identity';
import { fetchLeaderboard, submitScore } from './lib/leaderboardApi';

interface RunState {
  score: number;
  personalBest: number;
  isNewBest: boolean;
  submitStatus: SubmitStatus;
  entries: LeaderboardEntry[];
  entriesLoading: boolean;
  playerName: string | null;
}

const emptyRun: RunState = {
  score: 0,
  personalBest: 0,
  isNewBest: false,
  submitStatus: { kind: 'noop' },
  entries: [],
  entriesLoading: false,
  playerName: null,
};

export default function App() {
  const { isFirstVisit, markVisited } = useFirstVisit();
  const [screen, setScreen] = useState<Screen>('loading');
  const [character, setCharacter] = useState<Character | null>(null);
  const [run, setRun] = useState<RunState>(emptyRun);
  const sound = useSound();

  const handleLoadingDone = useCallback(() => {
    markVisited();
    setScreen('invite');
  }, [markVisited]);

  const submitIfQualified = useCallback(
    async (score: number, playerName: string, char: Character) => {
      const playerId = getOrCreatePlayerId();
      const priorBest = getPersonalBest();

      let submitStatus: SubmitStatus = { kind: 'noop' };
      let newBest = priorBest;

      if (score > priorBest) {
        submitStatus = { kind: 'pending' };
        try {
          const res = await submitScore({ playerId, name: playerName, character: char, score });
          if (res.accepted) {
            newBest = res.newScore;
            setPersonalBest(newBest);
            submitStatus = { kind: 'accepted' };
          } else {
            newBest = Math.max(priorBest, res.serverScore);
            setPersonalBest(newBest);
            submitStatus = { kind: 'server-was-higher' };
          }
        } catch {
          newBest = score;
          setPersonalBest(newBest);
          submitStatus = { kind: 'network-error' };
        }
      }

      const entries = await fetchLeaderboard();
      const topIsPlayer =
        submitStatus.kind === 'accepted' &&
        entries.length > 0 &&
        entries[0].playerId === playerId;

      setRun({
        score,
        personalBest: newBest,
        isNewBest: score > priorBest && submitStatus.kind === 'accepted',
        submitStatus,
        entries,
        entriesLoading: false,
        playerName,
      });

      setScreen(topIsPlayer ? 'firstPlace' : 'gameOver');
    },
    [],
  );

  const handleGameEnd = useCallback(
    async (score: number) => {
      if (!character) return;

      if (score < 3) {
        setRun({
          ...emptyRun,
          score,
          personalBest: getPersonalBest(),
          playerName: getPlayerName(),
        });
        setScreen('gameOver');
        return;
      }

      const playerName = getPlayerName();
      if (!playerName) {
        setRun({
          ...emptyRun,
          score,
          personalBest: getPersonalBest(),
          playerName: null,
          entriesLoading: true,
        });
        setScreen('gameOver');
        const entries = await fetchLeaderboard();
        setRun((r) => ({ ...r, entries, entriesLoading: false }));
        return;
      }

      await submitIfQualified(score, playerName, character);
    },
    [character, submitIfQualified],
  );

  const handleProvideName = useCallback(
    async (name: string) => {
      setPlayerName(name);
      if (!character) return;
      await submitIfQualified(run.score, name, character);
    },
    [character, run.score, submitIfQualified],
  );

  const fade = {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -8 },
    transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] as const },
  };

  return (
    <div className="min-h-dvh bg-bg text-parchment relative">
      {screen !== 'loading' && <SoundToggle sound={sound} />}

      {screen === 'loading' ? (
        <LoadingScreen onComplete={handleLoadingDone} slow={isFirstVisit} />
      ) : null}

      <AnimatePresence initial={false}>
        {screen === 'invite' && (
          <motion.div key="invite" {...fade}>
            <InviteScreen
              onStart={() => setScreen('select')}
              onViewLeaderboard={() => setScreen('leaderboard')}
              sound={sound}
            />
          </motion.div>
        )}
        {screen === 'leaderboard' && (
          <motion.div key="leaderboard" {...fade}>
            <LeaderboardScreen onBack={() => setScreen('invite')} />
          </motion.div>
        )}
        {screen === 'select' && (
          <motion.div key="select" {...fade}>
            <CharacterSelectScreen
              onBack={() => setScreen('invite')}
              onConfirm={(c) => {
                setCharacter(c);
                setLastCharacter(c);
                setScreen('game');
              }}
              sound={sound}
            />
          </motion.div>
        )}
        {screen === 'game' && character && (
          <motion.div key="game" {...fade}>
            <GameScreen
              character={character}
              sound={sound}
              onBack={() => setScreen('invite')}
              onGameEnd={handleGameEnd}
            />
          </motion.div>
        )}
        {screen === 'gameOver' && (
          <motion.div key="gameOver" {...fade}>
            <GameOverScreen
              score={run.score}
              personalBest={run.personalBest}
              isNewBest={run.isNewBest}
              submitStatus={run.submitStatus}
              playerId={getOrCreatePlayerId()}
              entries={run.entries}
              entriesLoading={run.entriesLoading}
              playerName={run.playerName}
              onProvideName={handleProvideName}
              onPlayAgain={() => {
                setRun(emptyRun);
                setScreen('select');
              }}
              onBackToInvite={() => {
                setRun(emptyRun);
                setScreen('invite');
              }}
            />
          </motion.div>
        )}
        {screen === 'firstPlace' && (
          <motion.div key="firstPlace" {...fade}>
            <FirstPlaceScreen
              score={run.score}
              onContinue={() => setScreen('gameOver')}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
