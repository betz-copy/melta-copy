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
                        borderRadius: '7px',
                        fontSize: '14px',
                        textOverflow: 'ellipsis',
                        '& input[type=number]::-webkit-inner-spin-button, & input[type=number]::-webkit-outer-spin-button': {
                            display: 'none',
                        },
                        color: '#53566E',
                    },

                    '& fieldset': {
                        borderColor: '#CCCFE5',
                        color: '#CCCFE5',
                    },
                    '& label': {
                        color: '#9398C2',
                        fontSize: 14,
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
                '::-webkit-scrollbar-track': { background: 'lightgrey', borderRadius: 20 },

                '.ag-theme-material': {
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

                '.ag-theme-material-dark': {
                    '--ag-material-primary-color': `${colors.main.dark} !important`,
                    '--ag-material-accent-color': `${colors.main.dark} !important`,
                },
            },
        },
    },
});
