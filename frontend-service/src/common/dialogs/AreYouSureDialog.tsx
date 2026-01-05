import { Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Grid, useTheme } from '@mui/material';
import i18next from 'i18next';
import React, { MouseEventHandler } from 'react';

const AreYouSureDialog: React.FC<{
    open: boolean;
    handleClose: () => void;
    title?: string;
    body?: React.ReactNode;
    isLoading?: boolean;
    onYes: MouseEventHandler;
    onNo?: MouseEventHandler;
    disableYesButton?: boolean;
    yesTitle?: string;
    noTitle?: string;
}> = ({
    open,
    handleClose,
    title = i18next.t('areYouSureDialog.title'),
    body,
    isLoading = false,
    onYes,
    onNo,
    disableYesButton,
    yesTitle = i18next.t('areYouSureDialog.yes'),
    noTitle = i18next.t('areYouSureDialog.no'),
}) => {
    const theme = useTheme();

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="xs" style={{ height: '100%', margin: 'auto', padding: '20px' }} disableEnforceFocus>
            <DialogTitle fontWeight={600} fontSize={20} color={theme.palette.primary.main}>
                {title}
            </DialogTitle>
            {!!body && (
                <DialogContent>
                    <>{body}</>
                </DialogContent>
            )}
            <DialogActions sx={{ display: 'flex', justifyContent: 'space-between', padding: '20px' }}>
                <Button variant="outlined" sx={{ borderRadius: '7px' }} onClick={onNo ?? handleClose}>
                    {noTitle}
                </Button>
                <Button variant="contained" sx={{ borderRadius: '7px', color: 'white' }} onClick={onYes} disabled={isLoading || disableYesButton}>
                    <Grid container alignItems="center" justifyContent="center" style={{ gap: '5px' }}>
                        {yesTitle}
                    </Grid>
                    {isLoading && <CircularProgress size={20} />}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export { AreYouSureDialog };
