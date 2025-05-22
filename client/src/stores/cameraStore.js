import { create } from 'zustand';

const useCameraStore = create((set, get) => ({
  camera: null,
  orbitControls: null,
  setCamera: (camera) => set({ camera }),
  setOrbitControls: (orbitControls) => set({ orbitControls }),
  getCamera: () => get().camera,
  getOrbitControls: () => get().orbitControls,
})); 

export { useCameraStore };