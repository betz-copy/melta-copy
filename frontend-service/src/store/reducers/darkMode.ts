import { createSlice } from '@reduxjs/toolkit';
import { LocalStorage } from '../../utils/localStorage';

export const darkModeSlice = createSlice({
    name: 'darkMode',
    initialState: () => {
        const isDarkMode = LocalStorage.get<boolean>('isDarkMode');
        return isDarkMode || false;
    },
    reducers: {
        toggleDarkMode: (state) => {
            LocalStorage.set('isDarkMode', !state);
            return !state;
        },
    },
});

export const { toggleDarkMode } = darkModeSlice.actions;

export default darkModeSlice.reducer;
