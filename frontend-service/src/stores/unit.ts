import { IGetUnits } from '@packages/unit';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UnitsState {
    enabledUnits: IGetUnits;
    setEnabledUnits: (units: IGetUnits) => void;
}

export const useUnitStore = create(
    persist<UnitsState>(
        (set) => ({
            enabledUnits: [],
            setEnabledUnits: (units) => set({ enabledUnits: units.filter(({ disabled }) => !disabled) }),
        }),
        { name: 'units' },
    ),
);
