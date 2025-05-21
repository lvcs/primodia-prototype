import { create } from 'zustand';
import zukeeper from 'zukeeper';

const useDebugStore = create(zukeeper((set) => ({
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
  globeDebugInfo: {
    // Placeholder for globe debug text or structured data
    rotation: '',
    // Placeholder for globe sliders data if needed
    // exampleSlider: 0,
  },
  setTileDebugHTML: (html) => set({ tileDebugHTML: html }),
  setCameraDebugInfo: (info) => set((state) => ({ cameraDebugInfo: { ...state.cameraDebugInfo, ...info } })),
  // action to update specific camera debug slider:
  // setCameraDebugSlider: (sliderName, value) => set(state => ({ cameraDebugInfo: { ...state.cameraDebugInfo, [sliderName]: value }})),
  setGlobeDebugInfo: (info) => set((state) => ({ globeDebugInfo: { ...state.globeDebugInfo, ...info } })),
  // action to update specific globe debug slider:
  // setGlobeDebugSlider: (sliderName, value) => set(state => ({ globeDebugInfo: { ...state.globeDebugInfo, [sliderName]: value }})),
})));

export { useDebugStore }; 