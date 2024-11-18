import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface MeltaPlusState {
    meltaPlus: boolean;
    toggleMeltaPlus: () => void;
}

export const useMeltaPlusStore = create(
    persist<MeltaPlusState>(
        (set, get) => ({
            meltaPlus: false,
            toggleMeltaPlus: () => set({ meltaPlus: !get().meltaPlus }),
        }),
        { name: 'meltaPlus' },
    ),
);
