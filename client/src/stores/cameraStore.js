import { create } from 'zustand';
import * as THREE from 'three';

const useCameraStore = create((set, get) => ({
  camera: null,
  orbitControls: null,
  setCamera: (camera) => set({ camera }),
  setOrbitControls: (orbitControls) => set({ orbitControls }),
  getCamera: () => get().camera,
  getOrbitControls: () => get().orbitControls,
})); 

export { useCameraStore };
