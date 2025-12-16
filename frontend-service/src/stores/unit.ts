import { IGetUnits } from '@microservices/shared';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UnitsState {
    filteredUnits: IGetUnits;
    setFilteredUnits: (units: IGetUnits) => void;
}

export const useUnitStore = create(
    persist<UnitsState>(
        (set) => ({
            filteredUnits: [],
            setFilteredUnits: (units) => set({ filteredUnits: units.filter(({ disabled }) => !disabled) }),
        }),
        { name: 'units' },
    ),
);
