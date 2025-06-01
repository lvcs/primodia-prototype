import { create } from 'zustand';

// Initial state for the scene store
const initialState = {
  scene: null,
};

export const useSceneStore = create((set, get) => ({
  // State properties
  scene: null,

  // Actions to modify state
  setScene: (scene) => set({ scene }),

  getScene: () => get().scene,

  // Clear scene reference
  clearScene: () => set({ scene: null }),

  // Reset to initial state
  resetSceneState: () => set(initialState),
})); 