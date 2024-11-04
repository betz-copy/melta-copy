import { createTheme, ThemeOptions } from '@mui/material';

const basicTheme: ThemeOptions = {
    direction: 'rtl',
    typography: {
        fontFamily: 'Rubik',
    },
    components: {
        MuiTextField: {
            defaultProps: {
                size: 'small',
            },
            styleOverrides: {
                root: {
                    '& .MuiInputBase-root': {
                        borderRadius: '10px',
                    },
                    '& fieldset': {
                        borderColor: '#CCCFE5',
                        color: '#CCCFE5',
                    },
                    '& label': {
                        color: '#9398C2',
                    },
                },
            },
        },
        MuiDialog: {
            styleOverrides: {
                paper: {
                    borderRadius: '20px',
                },
            },
        },
    },
};

export const sideBarTransition = 'all 0.3s linear';

// // TODO - move to globals file
// export const mainFontSizes = {
//     headlineTitleFontSize: '24px',
//     headlineSubTitleFontSize: '14px',
// };

// export const iconSize = {
//     width: '24px',
//     height: '24px',
// };

const colors = {
    main: {
        light: '#1E2775',
        dark: '#9398c2',
    },
} as const;

export const lightTheme = createTheme({
    ...basicTheme,
    palette: {
        primary: { main: colors.main.light },
    },
    components: {
        ...basicTheme.components,
        MuiCssBaseline: {
            styleOverrides: {
                fontFamily: 'Rubik',
                '::-webkit-scrollbar': { background: 'transparent', width: 6, height: 6 },
                '::-webkit-scrollbar-thumb': { background: '#787C9E', borderRadius: 20 },
                '::-webkit-scrollbar-track': { background: 'lightgray', borderRadius: 20 },

                '.ag-theme-material': {
                    '--ag-background-color': '#FFF !important',
                    '--ag-row-hover-color': '#EBEFFA !important',
                    '--ag-foreground-color': '#53566E !important',
                    '--ag-row-border-style': 'none',
                    '--ag-border-style': 'none',

                    '--ag-header-foreground-color': '#101440 !important',
                    '--ag-header-cell-hover-background-color': '#EBEFFA !important',
                    '--ag-header-cell-moving-background-color': '#EBEFFA !important',

                    '--ag-material-primary-color': `${colors.main.light} !important`,
                    '--ag-material-accent-color': `${colors.main.light} !important`,
                },
            },
        },
    },
});

export const darkTheme = createTheme({
    ...basicTheme,
    palette: {
        mode: 'dark',
        primary: { main: colors.main.dark },
    },
    components: {
        ...basicTheme.components,
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
                    '--ag-selected-row-background-color': '#363636 !important',
                    '--ag-checkbox-unchecked-color': '#fff !important',

                    '--ag-header-cell-hover-background-color': 'rgba(255, 255, 255, 0.12) !important',
                    '--ag-header-cell-moving-background-color': 'rgba(255, 255, 255, 0.12) !important',

                    '--ag-material-primary-color': `${colors.main.dark} !important`,
                    '--ag-material-accent-color': `${colors.main.dark} !important`,
                },

                '.ag-row': {
                    backgroundColor: '#212121 !important',
                },
            },
        },
    },
});
