import { create } from 'zustand';

// Initial state for the scene store
const initialState = {
  scene: null,
  renderer: null,
  isSceneInitialized: false,
  isRendererInitialized: false,
};

export const useSceneStore = create((set, get) => ({
  ...initialState,

  // Actions to modify state
  setScene: (scene) => set({ 
    scene, 
    isSceneInitialized: scene !== null 
  }),

  setRenderer: (renderer) => set({ 
    renderer, 
    isRendererInitialized: renderer !== null 
  }),

  getScene: () => get().scene,
  getRenderer: () => get().renderer,

  // Check if both scene and renderer are ready
  isReady: () => {
    const state = get();
    return state.isSceneInitialized && state.isRendererInitialized;
  },

  // Clear scene and renderer references
  clearScene: () => set({ 
    scene: null, 
    isSceneInitialized: false 
  }),

  clearRenderer: () => set({ 
    renderer: null, 
    isRendererInitialized: false 
  }),

  // Reset to initial state
  resetSceneState: () => set(initialState),
})); 