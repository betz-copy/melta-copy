import { createSlice } from '@reduxjs/toolkit';
import { LocalStorage } from '../../utils/localStorage';

export const darkModeSlice = createSlice({
    name: 'darkMode',
    initialState: () => {
        // const isDarkMode = LocalStorage.get<boolean>('isDarkMode');
        // TODO - implement when dark mode will be supported
        return false;
    },
    reducers: {
        toggleDarkMode: (state) => {
            LocalStorage.set('isDarkMode', !state);
            return false;
        },
    },
});

export const { toggleDarkMode } = darkModeSlice.actions;

export default darkModeSlice.reducer;
