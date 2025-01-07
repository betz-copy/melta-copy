import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface DarkModeState {
    darkMode: boolean;
    toggleDarkMode: () => void;
    setDarkMode: (darkMode: boolean) => void;
}

export const useDarkModeStore = create(
    persist<DarkModeState>(
        (set, get) => ({
            darkMode: false,
            toggleDarkMode: () => set({ darkMode: !get().darkMode }),
            setDarkMode: (darkMode) => set({ darkMode }),
        }),
        { name: 'darkMode' },
    ),
);
