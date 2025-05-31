import { create } from 'zustand';

// Initial state for the render store
const initialState = {
  renderer: null,
  canvas: null,
};

export const useRenderStore = create((set, get) => ({
  // State properties
  renderer: null,
  canvas: null,

  // Actions to modify state
  setRenderer: (renderer) => set({ renderer }),
  setCanvas: (canvas) => set({ canvas }),

  getRenderer: () => get().renderer,
  getCanvas: () => get().canvas,

  // Clear references
  clearRenderer: () => set({ renderer: null }),
  clearCanvas: () => set({ canvas: null }),

  // Reset to initial state
  resetRenderState: () => set(initialState),
}));
