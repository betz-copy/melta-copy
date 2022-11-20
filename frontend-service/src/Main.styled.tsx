import { Box, styled } from '@mui/material';

const MainBox = styled(Box)(({ theme }) => {
    const scrollbarBackground = theme.palette.mode === 'light' ? 'white' : '#131313';

    return {
        backgroundColor: theme.palette.mode === 'light' ? theme.palette.grey[100] : '#252527',
        flexGrow: 1,
        height: '100vh',
        '::-webkit-scrollbar': { background: scrollbarBackground, width: 10 },
        '::-webkit-scrollbar-track': { background: scrollbarBackground, marginTop: '3.6rem', borderRadius: 0 },
        '::-webkit-scrollbar-thumb': { background: theme.palette.primary.main },
    };
});

export { MainBox };
