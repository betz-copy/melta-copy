import React, { MouseEventHandler } from 'react';
import { Backdrop, Button, CircularProgress, Dialog, DialogActions, DialogTitle, Typography } from '@mui/material';
import i18next from 'i18next';

const AreYouSureDialog: React.FC<{
    open: boolean;
    handleClose: () => void;
    title?: string;
    isLoading?: boolean;
    message?: string;
    onYes: MouseEventHandler;
    onNo?: MouseEventHandler;
}> = ({ open, handleClose, title = i18next.t('areYouSureDialog.title'), isLoading = false, onYes, onNo, message }) => {
    return (
        <Dialog open={open} onClose={handleClose}>
            <Backdrop open={isLoading} style={{ zIndex: 999, backgroundColor: 'transparent' }} />
            <DialogTitle>
                <div>{title}</div>
                {message && (
                    <Typography variant="caption" color="textSecondary" width="100%">
                        {message}
                    </Typography>
                )}
            </DialogTitle>
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
