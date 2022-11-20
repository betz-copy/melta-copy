import { createTheme, ThemeOptions } from '@mui/material';

const basicTheme: ThemeOptions = {
    direction: 'rtl',
    typography: {
        fontFamily: 'OpenSans',
    },
};

export const lightTheme = createTheme({
    ...basicTheme,
    palette: {
        mode: 'light',
        primary: { main: '#225AA7' },
    },
    components: {
        MuiCssBaseline: {
            styleOverrides: {
                '::-webkit-scrollbar': { background: 'transparent', width: 6, height: 6 },
                '::-webkit-scrollbar-thumb': { background: 'gray', borderRadius: 20 },
                '::-webkit-scrollbar-track': { background: 'lightgray', borderRadius: 20 },
            },
        },
    },
});

export const darkTheme = createTheme({
    ...basicTheme,
    palette: {
        mode: 'dark',
        primary: { main: '#225AA7' },
    },
    components: {
        MuiCssBaseline: {
            styleOverrides: {
                '::-webkit-scrollbar': { background: 'transparent', width: 6, height: 6 },
                '::-webkit-scrollbar-thumb': { background: '#8e8e92', borderRadius: 20 },
                '::-webkit-scrollbar-track': { background: '#535356', borderRadius: 20 },

                // agGrid dark mode:
                '.ag-dnd-ghost': { backgroundColor: '#171717 !important' },
                '.ag-dnd-ghost-icon, .ag-dnd-ghost-label': { color: 'white !important' },

                '.ag-header-viewport, .ag-header-cell, .ag-side-buttons, .ag-root-wrapper, .ag-header-container, .ag-root-wrapper-body, .ag-paging-panel':
                    {
                        backgroundColor: '#171717 !important',
                        color: 'white !important',
                        borderColor: '#404040 !important',
                    },

                '.ag-pinned-left-header, .ag-cell.ag-cell-last-left-pinned:not(.ag-cell-range-right):not(.ag-cell-range-single-cell)': {
                    borderLeftColor: '#505050 !important',
                },

                '.ag-pinned-left-cols-container, .ag-header, .ag-row-odd, .ag-row-even': {
                    backgroundColor: '#212121 !important',
                    color: 'white !important',
                    borderColor: '#505050 !important',
                },

                '.ag-header-cell-moving, .ag-header-active': { backgroundColor: 'rgba(255, 255, 255, 0.12) !important' },

                '.ag-row-hover': { backgroundColor: 'rgba(255, 255, 255, 0.1) !important' },

                '.ag-icon, .ag-icon-filter, .ag-icon-grip, .ag-header-icon': { color: 'white !important' },

                '.ag-tabs-header, .ag-column-select, .ag-column-select-header, .ag-column-panel': {
                    color: 'white !important',
                    backgroundColor: '#202020 !important',
                    borderColor: '#505050 !important',
                },

                '.ag-input-field-input::placeholder, .ag-input-field-input': { color: 'white !important' },

                '.ag-tab, .ag-tabs': {
                    backgroundColor: '#202020 !important',
                    color: 'white !important',
                },

                '.ag-select .ag-picker-field-wrapper, .ag-picker-field-wrapper': {
                    backgroundColor: '#202020 !important',
                    borderColor: '#505050 !important',
                },
            },
        },
    },
});
