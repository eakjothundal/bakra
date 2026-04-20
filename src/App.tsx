import { useCallback, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { Character, Screen } from './types';
import { useFirstVisit } from './hooks/useFirstVisit';
import { useSound } from './hooks/useSound';
import { LoadingScreen } from './screens/LoadingScreen';
import { InviteScreen } from './screens/InviteScreen';
import { CharacterSelectScreen } from './screens/CharacterSelectScreen';
import { GameScreen } from './screens/GameScreen';
import { WonScreen } from './screens/WonScreen';
import { CardScreen } from './screens/CardScreen';
import { SoundToggle } from './components/SoundToggle';
import { StaticInvite } from './components/StaticInvite';

export default function App() {
  const { isFirstVisit, markVisited } = useFirstVisit();
  const [screen, setScreen] = useState<Screen>('loading');
  const [character, setCharacter] = useState<Character | null>(null);
  const sound = useSound();

  const handleLoadingDone = useCallback(() => {
    markVisited();
    setScreen('invite');
  }, [markVisited]);

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
            <InviteScreen onStart={() => setScreen('select')} sound={sound} />
          </motion.div>
        )}
        {screen === 'select' && (
          <motion.div key="select" {...fade}>
            <CharacterSelectScreen
              onBack={() => setScreen('invite')}
              onConfirm={(c) => {
                setCharacter(c);
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
              onWin={() => setScreen('won')}
            />
          </motion.div>
        )}
        {screen === 'won' && (
          <motion.div key="won" {...fade}>
            <WonScreen onContinue={() => setScreen('card')} />
          </motion.div>
        )}
        {screen === 'card' && (
          <motion.div key="card" {...fade}>
            <CardScreen onBack={() => setScreen('invite')} sound={sound} />
          </motion.div>
        )}
      </AnimatePresence>

      <StaticInvite />
    </div>
  );
}
