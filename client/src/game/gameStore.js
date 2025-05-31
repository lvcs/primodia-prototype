import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useGameStore = create(
  persist(
    (set, get) => ({
      seed: null,
      turn: null,
      setSeed: (seed) => set({ seed }),
      setTurn: (turn) => set({ turn }),
      getSeed: () => get().seed,
      getTurn: () => get().turn,
    }),
    {
      name: 'gameStore',
      partialize: (state) => ({ seed: state.seed }),
    }
  )
);

export { useGameStore };
