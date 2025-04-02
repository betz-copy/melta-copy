import React from 'react';
import { Dialog, DialogActions, DialogTitle } from '@mui/material';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';

const CreateChildTemplateDialog: React.FC<{
    open: boolean;
    handleClose: () => void;
    entityTemplate: IMongoEntityTemplatePopulated | null;
}> = ({ open, handleClose, entityTemplate }) => {
    return (
        <Dialog open={open} onClose={handleClose}>
            <DialogTitle>{entityTemplate?.displayName}</DialogTitle>

            <DialogActions />
        </Dialog>
    );
};

export { CreateChildTemplateDialog };
