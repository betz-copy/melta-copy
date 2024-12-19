/* eslint-disable react-hooks/rules-of-hooks */
import React, { useState } from 'react';
import { Box, Button, Dialog, DialogActions, DialogTitle } from '@mui/material';
import i18next from 'i18next';
import { useMutation, useQueryClient } from 'react-query';
import { AxiosError } from 'axios';
import { toast } from 'react-toastify';
import { IEntityTemplateMap, IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import { updateActionToEntity } from '../../services/templates/enitityTemplatesService';
import { ErrorToast } from '../ErrorToast';
import { AreYouSureDialog } from './AreYouSureDialog';

const ChooseTemplatePathDialog: React.FC<{
    open: boolean;
    handleClose: () => void;
    entityTemplate: IMongoEntityTemplatePopulated | null;
}> = ({ open, handleClose, entityTemplate }) => {
    if (!entityTemplate) return null;

    const queryClient = useQueryClient();

    const [pathValue, setPathValue] = useState('');
    const [closeActionDialog, setCloseActionDialog] = useState(false);

    const hasRootPath = false;

    const { mutateAsync, isLoading } = useMutation(
        () => {
            return updateActionToEntity(entityTemplate._id, pathValue);
        },
        {
            onError: (err: AxiosError) => {
                toast.error(<ErrorToast axiosError={err} defaultErrorMessage={i18next.t('addPathToTemplateDialog.failedToCreatePath')} />);
            },
            onSuccess: (data) => {
                const { actions } = data;

                queryClient.setQueryData<IEntityTemplateMap>('getEntityTemplates', (entityTemplateMap) =>
                    entityTemplateMap!.set(entityTemplate._id, { ...entityTemplate, actions }),
                );

                toast.success(i18next.t('addPathToTemplateDialog.succeededToCreatePath'));
                handleClose();
            },
        },
    );

    const handleConvertToRootPath = () => {
        console.log('convert to root path');
    };

    const handleAddPath = () => {
        console.log('add path');
    };

    return (
        <Box>
            <Dialog open={open} onClose={handleClose}>
                <DialogTitle>{`${i18next.t('systemManagement.addPathToTemplate')}: ${entityTemplate?.displayName}`}</DialogTitle>

                <DialogActions>
                    {!hasRootPath ? (
                        <Button onClick={handleConvertToRootPath}>{i18next.t('addPathToTemplateDialog.convertToRootPath')}</Button>
                    ) : (
                        <Button onClick={handleAddPath}>{i18next.t('addPathToTemplateDialog.createBtn')}</Button>
                    )}
                </DialogActions>
            </Dialog>
            <AreYouSureDialog
                open={closeActionDialog}
                handleClose={() => setCloseActionDialog(false)}
                onYes={handleClose}
                isLoading={isLoading}
                body={i18next.t('systemManagement.entityAction.theCodeWillBeDeletedOnClose')}
            />
        </Box>
    );
};

export { ChooseTemplatePathDialog };
