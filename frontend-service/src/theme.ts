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
        primary: { main: '#1E2775' },
    },
    components: {
        MuiInputBase: {
            styleOverrides: {
                input: {
                    backgroundColor: '#EBEFFA',
                },
                root: {
                    backgroundColor: '#EBEFFA',
                },
            },
        },
        MuiCssBaseline: {
            styleOverrides: {
                '::-webkit-scrollbar': { background: 'transparent', width: 6, height: 6 },
                '::-webkit-scrollbar-thumb': { background: 'gray', borderRadius: 20 },
                '::-webkit-scrollbar-track': { background: 'lightgray', borderRadius: 20 },

                '.ag-theme-material': {
                    '--ag-background-color': '#FFF !important',
                    '--ag-row-hover-color': '#EBEFFA !important',
                    '--ag-foreground-color': '#53566E !important',

                    '--ag-header-foreground-color': '#101440 !important',
                    '--ag-header-cell-hover-background-color': '#EBEFFA !important',
                    '--ag-header-cell-moving-background-color': '#EBEFFA !important',
                },
            },
        },
    },
});

export const darkTheme = createTheme({
    ...basicTheme,
    palette: {
        mode: 'dark',
        primary: { main: '#1E2775' },
    },
    components: {
        MuiCssBaseline: {
            styleOverrides: {
                '::-webkit-scrollbar': { background: 'transparent', width: 6, height: 6 },
                '::-webkit-scrollbar-thumb': { background: '#8e8e92', borderRadius: 20 },
                '::-webkit-scrollbar-track': { background: '#535356', borderRadius: 20 },

                // agGrid dark mode:
                '.ag-theme-material': {
                    '--ag-row-hover-color': 'rgba(255, 255, 255, 0.1) !important',
                    '--ag-foreground-color': 'white !important',
                    '--ag-secondary-foreground-color': 'white !important', // used for "ag-paging-panel", menu icons, and more?
                    '--ag-disabled-foreground-color': 'rgba(255, 255, 255, 0.7) !important', // used also for placeholders color
                    '--ag-header-foreground-color': 'white !important',
                    '--ag-background-color': '#171717 !important',
                    '--ag-header-background-color': '#171717 !important',
                    '--ag-border-color': '#404040 !important',
                    '--ag-control-panel-background-color': '#202020 !important',
                    '--ag-subheader-background-color': '#202020 !important',

                    '--ag-header-cell-hover-background-color': 'rgba(255, 255, 255, 0.12) !important',
                    '--ag-header-cell-moving-background-color': 'rgba(255, 255, 255, 0.12) !important',
                },

                '.ag-row': {
                    backgroundColor: '#212121 !important',
                },
            },
        },
    },
});
