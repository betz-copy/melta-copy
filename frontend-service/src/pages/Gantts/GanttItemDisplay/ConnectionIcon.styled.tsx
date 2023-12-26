import { styled } from '@mui/material';
import { ImportExport } from '@mui/icons-material';

export const ConnectionIcon = styled(ImportExport)(({ theme }) => ({
    color: theme.palette.mode === 'light' ? 'gray' : '#969595',
}));
