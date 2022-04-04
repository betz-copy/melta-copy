import React, { MouseEventHandler } from 'react';
import { Button, CircularProgress, Dialog, DialogActions, DialogTitle } from '@mui/material';
import i18next from 'i18next';

const AreYouSureDialog: React.FC<{
    open: boolean;
    handleClose: () => void;
    title: string;
    isLoading?: boolean;
    onYes: MouseEventHandler;
    onNo: MouseEventHandler;
}> = ({ open, handleClose, title, isLoading = false, onYes, onNo }) => {
    return (
        <Dialog open={open} onClose={handleClose}>
            <DialogTitle>{title}</DialogTitle>
            <DialogActions>
                <Button onClick={onNo}>{i18next.t('areYouSureDialog.no')}</Button>
                <Button onClick={onYes} autoFocus disabled={isLoading}>
                    {i18next.t('areYouSureDialog.yes')}
                    {isLoading && <CircularProgress size={20} />}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export { AreYouSureDialog };
