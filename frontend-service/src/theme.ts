import { createTheme } from '@mui/material';

export const globalTheme = createTheme({
    direction: 'rtl',
    palette: {
        mode: 'light',
        primary: { main: '#225AA7' },
    },
    typography: {
        fontFamily: 'OpenSans',
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
