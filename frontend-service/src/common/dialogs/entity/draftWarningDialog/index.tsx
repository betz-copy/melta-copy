import { Close as CloseIcon, Done as DoneIcon } from '@mui/icons-material';
import { Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Divider, Grid } from '@mui/material';
import i18next from 'i18next';
import React, { MouseEventHandler } from 'react';

const DraftSaveDialog: React.FC<{
    open: boolean;
    handleClose: () => void;
    title?: string;
    body?: React.ReactNode;
    isLoading?: boolean;
    onYes: MouseEventHandler;
    onNo?: MouseEventHandler;
    noButtonTitle?: string;
    yesButtonTitle?: string;
}> = ({
    open,
    handleClose,
    title = i18next.t('areYouSureDialog.title'),
    body,
    isLoading = false,
    onYes,
    onNo,
    noButtonTitle = i18next.t('areYouSureDialog.no'),
    yesButtonTitle = i18next.t('areYouSureDialog.yes'),
}) => {
    return (
        <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
            <Box margin="1rem">
                <DialogTitle>{title}</DialogTitle>
                {body && <DialogContent>{body}</DialogContent>}
                <Divider sx={{ margin: '1rem' }} />
                <DialogActions sx={{ padding: '1rem' }}>
                    <Grid container flexDirection="row" flexWrap="nowrap" justifyContent="space-between">
                        <Grid item>
                            <Button variant="outlined" sx={{ borderRadius: '8px' }} onClick={onNo ?? handleClose} startIcon={<CloseIcon />}>
                                {noButtonTitle}
                            </Button>
                        </Grid>
                        <Grid item>
                            <Button variant="contained" sx={{ borderRadius: '8px' }} onClick={onYes} disabled={isLoading} startIcon={<DoneIcon />}>
                                {yesButtonTitle}
                                {isLoading && <CircularProgress size={20} />}
                            </Button>
                        </Grid>
                    </Grid>
                </DialogActions>
            </Box>
        </Dialog>
    );
};

export { DraftSaveDialog };
