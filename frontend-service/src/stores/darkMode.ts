import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface DarkModeState {
    darkMode: boolean;
    toggleDarkMode: () => void;
}

export const useDarkModeStore = create(
    persist<DarkModeState>(
        (set, get) => ({
            darkMode: false,
            toggleDarkMode: () => set({ darkMode: !get().darkMode }),
        }),
        { name: 'darkMode' },
    ),
);
