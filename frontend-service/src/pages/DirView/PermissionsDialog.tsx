import { Dialog } from '@mui/material';
import React from 'react';
import { useUserStore } from '../../stores/user';
import { useWorkspaceStore } from '../../stores/workspace';

interface IPermissionsDialogProps {
    open: boolean;
    handleClose: () => void;
}

export const PermissionsDialog: React.FC<IPermissionsDialogProps> = ({ open, handleClose }) => {
    const currentUser = useUserStore((state) => state.user);
    const workspace = useWorkspaceStore((state) => state.workspace);

    

    return (
        <Dialog open={open} onClose={handleClose} fullWidth>
            <h1>Hello</h1>
            <h2>World</h2>
        </Dialog>
    );
};
