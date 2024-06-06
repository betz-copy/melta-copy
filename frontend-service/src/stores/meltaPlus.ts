import { create } from 'zustand';

interface MeltaPlusState {
    meltaPlus: boolean;
    toggleMeltaPlus: () => void;
}

export const useMeltaPlusStore = create<MeltaPlusState>((set, get) => ({
    meltaPlus: false,
    toggleMeltaPlus: () => set({ meltaPlus: !get().meltaPlus }),
}));
