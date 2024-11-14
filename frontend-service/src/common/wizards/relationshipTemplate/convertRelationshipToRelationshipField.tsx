import { Button, CircularProgress, Dialog, DialogActions, DialogTitle } from '@mui/material';
import i18next from 'i18next';
import React, { MouseEventHandler } from 'react';

const ConvertToRelationship: React.FC<{
    open: boolean;
    handleClose: () => void;
    isLoading?: boolean;
    onYes: MouseEventHandler;
}> = ({ open, handleClose, isLoading = false, onYes }) => {
    return (
        <Dialog open={open} onClose={handleClose}>
            <DialogTitle>title</DialogTitle>

            <DialogActions>
                <Button onClick={onYes} disabled={isLoading}>
                    {i18next.t('areYouSureDialog.yes')}
                    {isLoading && <CircularProgress size={20} />}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export { ConvertToRelationship };
