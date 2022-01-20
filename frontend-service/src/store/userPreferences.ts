import { PaletteMode } from '@mui/material';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { LocalStorage } from '../utils/localStorage';

export interface UserPreferencesState {
    paletteMode: PaletteMode;
}

const initialState: UserPreferencesState = {
    paletteMode: LocalStorage.get('paletteMode', 'light'),
};

export const userPreferencesSlice = createSlice({
    name: 'userPreferences',
    initialState,
    reducers: {
        setPaletteMode: (state, action: PayloadAction<PaletteMode>) => {
            state.paletteMode = action.payload;
        },
    },
});

export const { setPaletteMode } = userPreferencesSlice.actions;

export default userPreferencesSlice.reducer;
