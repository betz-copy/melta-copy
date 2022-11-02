import { Box, styled } from '@mui/material';

const MainBox = styled(Box)(({ theme }) => ({
    backgroundColor: theme.palette.mode === 'light' ? theme.palette.grey[100] : theme.palette.grey[900],
    flexGrow: 1,
    height: '100vh',
    '::-webkit-scrollbar': { background: 'white', width: 10 },
    '::-webkit-scrollbar-track': { background: 'transparent', marginTop: '3.55rem' },
    '::-webkit-scrollbar-thumb': { background: '#225AA7' },
}));

export { MainBox };
