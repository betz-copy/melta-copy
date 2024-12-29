/* eslint-disable react-hooks/rules-of-hooks */
import React, { useEffect, useState } from 'react';
import { Box, Button, CircularProgress, Dialog, DialogActions, DialogTitle } from '@mui/material';
import i18next from 'i18next';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { AxiosError } from 'axios';
import { toast } from 'react-toastify';
import { Done } from '@mui/icons-material';
import { IEntityTemplateMap, IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import { getEntityTemplatesTree, updateEntityTemplatePathRequest } from '../../services/templates/enitityTemplatesService';
import { ErrorToast } from '../ErrorToast';
import TemplatesTree from '../TemplatesTree';

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

    const { mutateAsync: updateEntityTemplatePath, isLoading } = useMutation(
        () => updateEntityTemplatePathRequest(currEntityTemplate._id, pathValue),
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

    const { data: entityTemplatesTree, isLoading: isLoadingTemplatesTree } = useQuery(['getTemplatesTree', currEntityTemplate.category._id], () =>
        getEntityTemplatesTree(currEntityTemplate.category._id),
    );

    const handleConvertToRootPath = async () => {
        setPathValue('/');
        await updateEntityTemplatePath();
    };

    useEffect(() => {
        const pathRegex = /^\/(?:[^/]*\/?)*$/;
        setValidationErrors(!pathRegex.test(pathValue));
    }, [pathValue]);

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            PaperProps={{
                style: {
                    alignItems: 'center',
                },
            }}
        >
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
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '10px' }}>
                        {!isLoadingTemplatesTree && (
                            <TemplatesTree
                                onClickItem={(selectedPath) => setPathValue(selectedPath)}
                                templatesWithChildren={[entityTemplatesTree ?? { _id: '/', children: [], displayName: '/', path: '/' }]}
                            />
                        )}
                        <input
                            type="text"
                            value={pathValue}
                            disabled
                            placeholder={i18next.t('addPathToTemplateDialog.pathPlaceholder')}
                            style={{ borderRadius: '10px', padding: '10px' }}
                        />
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={isLoading || pathValue === '/'}
                            sx={{ borderRadius: '10px' }}
                            onClick={handleConvertToRootPath}
                        >
                            {i18next.t('addPathToTemplateDialog.createBtn')}
                            {isLoading && <CircularProgress size={20} />}
                            <Done />
                        </Button>
                    </Box>
                )}
            </DialogActions>
        </Dialog>
    );
};

export { ChooseTemplatePathDialog };
