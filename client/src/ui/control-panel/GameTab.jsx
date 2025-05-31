import { useState, useEffect } from 'react';

import { useGameStore } from '@stores';
import { ControlSectionWrapper } from '@ui/components/ControlSectionWrapper';

const applyGamePanelControls = (updatedGame) => {
  const { setSeed } = useGameStore.getState();
  
  if (updatedGame.seed !== undefined) {
    setSeed(updatedGame.seed);
  }
};

const GameTab = () => {
  const seed = useGameStore((state) => state.seed);
  const turn = useGameStore((state) => state.turn);

  const [currentSeed, setCurrentSeed] = useState(seed);
  const [currentTurn, setCurrentTurn] = useState(turn || 1);

  useEffect(() => {
    if (seed !== null) {
      setCurrentSeed(seed);
    }
    if (turn !== null) {
      setCurrentTurn(turn);
    }
  }, [seed, turn]);

  const handleSeedInput = (event) => {
    const value = parseInt(event.target.value) || 0;
    setCurrentSeed(value);
    applyGamePanelControls({ seed: value });
  };

  return (
    <section>
      <ControlSectionWrapper label={`Seed:`}>
        <div className="space-y-2">
          <input
            type="number"
            value={currentSeed}
            onChange={handleSeedInput}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter seed value"
          />
        </div>
      </ControlSectionWrapper>

      <ControlSectionWrapper label={`Turn:`}>
        <input
          type="number"
          value={currentTurn || 0}
          disabled
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-100 text-gray-600 cursor-not-allowed"
          placeholder="Turn (read-only)"
        />
      </ControlSectionWrapper>
    </section>
  );
};

export default GameTab;
