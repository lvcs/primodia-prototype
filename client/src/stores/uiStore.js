import { create } from 'zustand';

// Initial state for the UI store
const initialState = {
  isMainMenuOpen: false,
  isSettingsModalOpen: false,
  notifications: [], // Array of notification objects { id, message, type }
  activeTooltip: null, // { id, content, position }
};

export const useUIStore = create((set, get) => ({
  ...initialState,

  // Actions to modify state
  toggleMainMenu: () => set((state) => ({ isMainMenuOpen: !state.isMainMenuOpen })),
  openSettingsModal: () => set({ isSettingsModalOpen: true }),
  closeSettingsModal: () => set({ isSettingsModalOpen: false }),

  addNotification: (notification) =>
    set((state) => ({
      notifications: [...state.notifications, { id: Date.now(), ...notification }],
    })),

  removeNotification: (notificationId) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== notificationId),
    })),

  showTooltip: (tooltip) => set({ activeTooltip: tooltip }),
  hideTooltip: () => set({ activeTooltip: null }),

  // Example of an action that uses get()
  getNotificationCount: () => get().notifications.length,

  // Reset to initial state (optional)
  resetUIState: () => set(initialState),
})); 