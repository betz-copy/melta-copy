import React, { MouseEventHandler } from 'react';
import { Button, CircularProgress, Dialog, DialogActions, DialogTitle, Typography } from '@mui/material';
import i18next from 'i18next';

const AreYouSureDialog: React.FC<{
    open: boolean;
    handleClose: () => void;
    title?: string;
    isLoading?: boolean;
    fromDeletion: boolean;
    onYes: MouseEventHandler;
    onNo?: MouseEventHandler;
}> = ({ open, handleClose, title = i18next.t('areYouSureDialog.title'), isLoading = false, onYes, onNo, fromDeletion }) => {
    return (
        <Dialog open={open} onClose={handleClose}>
            <DialogTitle><div>{title}</div>
            {fromDeletion ? <div>
                        <Typography variant="caption" color="textSecondary">{i18next.t('areYouSureDialog.disclaimer')}</Typography>
                    </div> : null}
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
