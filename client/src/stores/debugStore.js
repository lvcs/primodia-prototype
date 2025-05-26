import { create } from 'zustand';

const useDebugStore = create((set) => ({
  tileDebugHTML: '<p>Tile debug info will appear here.</p>',
  cameraDebugInfo: {
    // Placeholder for camera debug text or structured data
    position: '',
    target: '',
    distance: '',
    fov: '',
    // Placeholder for camera sliders data if needed
    // exampleSlider: 0,
  },
  planetDebugInfo: {
    // Placeholder for planet debug text or structured data
    rotation: '',
    // Placeholder for planet sliders data if needed
    // exampleSlider: 0,
  },
  setTileDebugHTML: (html) => set({ tileDebugHTML: html }),
  setCameraDebugInfo: (info) => set((state) => ({ cameraDebugInfo: { ...state.cameraDebugInfo, ...info } })),
  // action to update specific camera debug slider:
  // setCameraDebugSlider: (sliderName, value) => set(state => ({ cameraDebugInfo: { ...state.cameraDebugInfo, [sliderName]: value }})),
  setPlanetDebugInfo: (info) => set((state) => ({ planetDebugInfo: { ...state.planetDebugInfo, ...info } })),
  // action to update specific planet debug slider:
  // setPlanetDebugSlider: (sliderName, value) => set(state => ({ planetDebugInfo: { ...state.planetDebugInfo, [sliderName]: value }})),
}));

export { useDebugStore }; 