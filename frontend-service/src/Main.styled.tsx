import { Box, styled } from '@mui/material';

const MainBox = styled(Box)(({ theme }) => ({
    backgroundColor: theme.palette.mode === 'light' ? theme.palette.grey[100] : theme.palette.grey[900],
    flexGrow: 1,
    height: '100vh',
    overflow: 'auto',
}));

export { MainBox };
