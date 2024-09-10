import { Dialog } from '@mui/material';
import React from 'react';

interface IPermissionsDialogProps {
    open: boolean;
    handleClose: () => void;
}

export const PermissionsDialog: React.FC<IPermissionsDialogProps> = ({ open, handleClose }) => {
    return (
        <Dialog open={open} onClose={handleClose}>
            <h1>foo</h1>
            <h2>bar</h2>
        </Dialog>
    );
};
