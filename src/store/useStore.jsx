import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useStore = create(
  persist(
    (set) => ({
      settings: {
        currency: 'EUR',
        language: 'fr',
        displayMode: 'grid',
        zoomLevel: 3,
        theme: 'dark',
        accentColor: 'gray',
        hideWishlistOnOwned: false,
        grayscaleNonOwned: true
      },
      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings }
        })),
      clearData: () =>
        set({
          settings: { currency: 'EUR', language: 'fr', displayMode: 'grid', zoomLevel: 3, theme: 'dark', accentColor: 'gray', hideWishlistOnOwned: false, grayscaleNonOwned: true }
        })
    }),
    {
      name: 'digicollection-storage',
      partialize: (state) => ({ settings: state.settings })
    }
  )
);

export default useStore;
