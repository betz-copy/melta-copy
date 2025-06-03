import { styled, TextField } from '@mui/material';

export const StyledFilterInput = styled(TextField)(({ theme }) => ({
    '& .MuiInputBase-root': {
        borderRadius: '7px',
        backgroundColor: theme.palette.mode === 'dark' ? undefined : 'white',
    },
    '& .MuiInputBase-input': {
        color: theme.palette.mode === 'dark' ? undefined : ' rgba(83, 86, 110, 1)',
        fontSize: '1rem',
        fontWeight: '400',
    },
    '& fieldset': {
        borderColor: '#CCCFE5',
        color: '#CCCFE5',
    },
    '& label': {
        color: '#9398C2',
    },
}));
