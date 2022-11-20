import { createSlice } from '@reduxjs/toolkit';

export const meltaPlusSlice = createSlice({
    name: 'meltaPlus',
    initialState: false,
    reducers: {
        toggleMeltaPlus: (state) => {
            return !state;
        },
    },
});

export const { toggleMeltaPlus } = meltaPlusSlice.actions;

export default meltaPlusSlice.reducer;
