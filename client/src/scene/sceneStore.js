import { create } from 'zustand';

// Initial state for the scene store
const initialState = {
  scene: null,
  renderer: null,
};

export const useSceneStore = create((set, get) => ({
  // State properties
  scene: null,
  renderer: null,

  // Actions to modify state
  setScene: (scene) => set({ scene }),
  setRenderer: (renderer) => set({ renderer }),

  getScene: () => get().scene,
  getRenderer: () => get().renderer,

  // Clear scene and renderer references
  clearScene: () => set({ scene: null }),
  clearRenderer: () => set({ renderer: null }),

  // Reset to initial state
  resetSceneState: () => set(initialState),
})); 