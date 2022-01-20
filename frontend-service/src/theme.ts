import { createTheme, PaletteMode } from '@mui/material';

export const globalTheme = (paletteMode: PaletteMode) =>
    createTheme({
        direction: 'rtl',
        palette: {
            mode: paletteMode,
        },
        components: {
            MuiDialog: {
                styleOverrides: {
                    root: {
                        direction: 'rtl',
                    },
                },
            },
        },
    });
