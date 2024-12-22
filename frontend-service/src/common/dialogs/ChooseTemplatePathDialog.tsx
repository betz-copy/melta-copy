/* eslint-disable react-hooks/rules-of-hooks */
import React, { useEffect, useState } from 'react';
import { Box, Button, CircularProgress, Dialog, DialogActions, DialogTitle } from '@mui/material';
import i18next from 'i18next';
import { useMutation, useQueryClient } from 'react-query';
import { AxiosError } from 'axios';
import { toast } from 'react-toastify';
import { Done } from '@mui/icons-material';
import { IEntityTemplateMap, IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import { updateEntityTemplatePathRequest } from '../../services/templates/enitityTemplatesService';
import { ErrorToast } from '../ErrorToast';
import { EntityTemplatesTree } from '../EntityTemplatesTree';

const ChooseTemplatePathDialog: React.FC<{
    open: boolean;
    handleClose: () => void;
    currEntityTemplate: IMongoEntityTemplatePopulated | null;
}> = ({ open, handleClose, currEntityTemplate }) => {
    if (!currEntityTemplate) return null;

    const [validationErrors, setValidationErrors] = useState(false);
    const [pathValue, setPathValue] = useState('/');

    const queryClient = useQueryClient();
    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;
    const entityTemplateMapByCategory = Array.from(entityTemplates.values()).filter(
        (entityTemplate) => entityTemplate.category._id === currEntityTemplate.category._id,
    );

    const hasRootPath = entityTemplateMapByCategory.some((entityTemplate) => entityTemplate.path === '/');

    const { mutateAsync, isLoading } = useMutation(
        () => {
            return updateEntityTemplatePathRequest(currEntityTemplate._id, pathValue);
        },
        {
            onError: (err: AxiosError) => {
                toast.error(<ErrorToast axiosError={err} defaultErrorMessage={i18next.t('addPathToTemplateDialog.failedToCreatePath')} />);
            },
            onSuccess: (data) => {
                const { path } = data;

                queryClient.setQueryData<IEntityTemplateMap>('getEntityTemplates', (entityTemplateMap) =>
                    entityTemplateMap!.set(currEntityTemplate._id, { ...currEntityTemplate, path }),
                );

                toast.success(i18next.t('addPathToTemplateDialog.succeededToCreatePath'));
                handleClose();
            },
        },
    );

    const handleConvertToRootPath = async () => {
        setPathValue('/');
        await mutateAsync();
    };

    const handleAddPath = async () => {
        await mutateAsync();
    };

    useEffect(() => {
        const pathRegex = /^\/(?:[^/]*\/?)*$/;
        setValidationErrors(!pathRegex.test(pathValue));
    }, [pathValue]);

    return (
        <Box>
            <Dialog open={open} onClose={handleClose}>
                <DialogTitle>{`${i18next.t('systemManagement.addPathToTemplate')}: ${currEntityTemplate?.displayName}`}</DialogTitle>

                <DialogActions>
                    {!hasRootPath ? (
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={isLoading || validationErrors}
                            sx={{ borderRadius: '10px' }}
                            onClick={handleConvertToRootPath}
                        >
                            {i18next.t('addPathToTemplateDialog.convertToRootPath')}
                            {isLoading && <CircularProgress size={20} />}
                            <Done />
                        </Button>
                    ) : (
                        <Box>
                            <EntityTemplatesTree
                                title={i18next.t('addPathToTemplateDialog.createBtn')}
                                entityTemplates={entityTemplateMapByCategory}
                            />
                            <Button onClick={handleAddPath}>{i18next.t('addPathToTemplateDialog.createBtn')}</Button>
                        </Box>
                    )}
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export { ChooseTemplatePathDialog };
