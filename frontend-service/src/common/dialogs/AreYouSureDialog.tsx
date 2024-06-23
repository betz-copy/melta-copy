import React, { MouseEventHandler } from 'react';
import { Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import i18next from 'i18next';

const AreYouSureDialog: React.FC<{
    open: boolean;
    handleClose: () => void;
    title?: string;
    body?: React.ReactNode;
    isLoading?: boolean;
    onYes: MouseEventHandler;
    onNo?: MouseEventHandler;
}> = ({ open, handleClose, title = i18next.t('areYouSureDialog.title'), body, isLoading = false, onYes, onNo }) => {
    return (
        <Dialog open={open} onClose={handleClose}>
            <DialogTitle>{title}</DialogTitle>
            {body && <DialogContent>{body}</DialogContent>}
            <DialogActions>
                <Button onClick={onNo ?? handleClose}>{i18next.t('areYouSureDialog.no')}</Button>
                <Button onClick={onYes} disabled={isLoading}>
                    {i18next.t('areYouSureDialog.yes')}
                    {isLoading && <CircularProgress size={20} />}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export { AreYouSureDialog };
