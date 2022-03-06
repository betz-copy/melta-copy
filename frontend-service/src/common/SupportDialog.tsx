import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogContentText, Button, DialogActions, Link } from '@mui/material';
import i18next from 'i18next';
import { useQueryClient } from 'react-query';
import { BoldText } from './SupportDialog.styled';
import { BackendConfigState } from '../services/backendConfigService';

type SupportDialogProps = {
    handleClose: () => void;
    open: boolean;
};

const SupportDialog: React.FC<SupportDialogProps> = ({ open, handleClose }) => {
    const queryClient = useQueryClient();
    const config = queryClient.getQueryData<BackendConfigState>('getBackendConfig');

    return (
        <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
            <DialogTitle>{i18next.t('supportDialog.title')}</DialogTitle>
            <DialogContent>
                {config?.contactByMailLink && (
                    <>
                        <BoldText>{i18next.t('supportDialog.contactByMail')}</BoldText>
                        <DialogContentText>
                            <Link href={`mailto:${config.contactByMailLink}`}>{config.contactByMailLink}</Link>
                        </DialogContentText>
                    </>
                )}
                {config?.contactByChatLink && (
                    <>
                        <BoldText>{i18next.t('supportDialog.contactByChat')}</BoldText>
                        <DialogContentText>
                            <Link href={config.contactByChatLink}>{config.contactByChatLink}</Link>
                        </DialogContentText>
                    </>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose} color="primary">
                    {i18next.t('supportDialog.close')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export { SupportDialog };
