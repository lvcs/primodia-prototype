import { create } from 'zustand';

export const useRenderStore = create((set, get) => ({
  // State
  renderer: null,
  canvas: null,
  canvasWidth: 0,
  canvasHeight: 0,

  // Actions
  setRenderer: (renderer) => set({ renderer }),
  setCanvas: (canvas) => set({ canvas }),
  setCanvasDimensions: (width, height) => set({ canvasWidth: width, canvasHeight: height }),

  // Getters
  getRenderer: () => get().renderer,
  getCanvas: () => get().canvas,
  getAspectRatio: () => {
    const { canvasWidth, canvasHeight } = get();
    return canvasHeight > 0 ? canvasWidth / canvasHeight : 1;
  },

  // Reset
  resetRenderState: () => set({ renderer: null, canvas: null, canvasWidth: 0, canvasHeight: 0 }),
}));
