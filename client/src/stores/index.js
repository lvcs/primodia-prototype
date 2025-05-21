// This file will export all Zustand stores.
export { useUIStore } from './uiStore';
export { useCameraStore } from './cameraStore';
export { useWorldStore } from './worldStore';
export { useDebugStore } from './debugStore';
export { useAuthStore } from './authStore';
// Example:
// export { useExampleStore } from './exampleStore'; 

// Legacy exports for backward compatibility (will be removed later)
export { useCameraStore as useCameraUIStore } from './cameraStore';
export { useWorldStore as useWorldSettingsStore } from './worldStore'; 