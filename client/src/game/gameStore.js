import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useGameStore = create(
  persist(
    (set, get) => ({
      seed: null,
      prngSeed: null,
      turn: null,
      setSeed: (seed) => set({ seed }),
      setPrngSeed: (prngSeed) => set({ prngSeed }),
      setTurn: (turn) => set({ turn }),
      getSeed: () => get().seed,
      getPrngSeed: () => get().prngSeed,
      getTurn: () => get().turn,
    }),
    {
      name: 'gameStore',
      partialize: (state) => ({ seed: state.seed }),
    }
  )
);

export { useGameStore };
