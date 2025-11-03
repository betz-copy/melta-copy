import { ImportExport } from '@mui/icons-material';
import { styled } from '@mui/material';

export const ConnectionIcon = styled(ImportExport)(({ theme }) => ({
    color: theme.palette.mode === 'light' ? 'gray' : '#969595',
}));
