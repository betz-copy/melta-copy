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
});
