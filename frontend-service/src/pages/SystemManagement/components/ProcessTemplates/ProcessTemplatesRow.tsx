import React, { useState } from 'react';
import { Grid, IconButton } from '@mui/material';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import i18next from 'i18next';
import { AxiosError } from 'axios';
import { ProcessTemplateWizard } from '../../../../common/wizards/processTemplate';
import { deleteProcessTemplateRequest, processTemplateObjectToProcessTemplateForm } from '../../../../services/templates/processTemplatesService';
import { AreYouSureDialog } from '../../../../common/dialogs/AreYouSureDialog';
import { ErrorToast } from '../../../../common/ErrorToast';
import SearchInput from '../../../../common/inputs/SearchInput';
import { IMongoProcessTemplatePopulated, IProcessTemplateMap } from '../../../../interfaces/processes/processTemplate';
import { ProcessTemplateCard } from './ProcessTemplateCard';

const ProcessTemplatesRow: React.FC = () => {
    const queryClient = useQueryClient();
    const [searchText, setSearchText] = useState('');

    const processTemplates = queryClient.getQueryData<IMongoProcessTemplatePopulated[]>('getProcessTemplates')!;
    const [deleteProcessTemplateDialogState, setDeleteProcessTemplateDialogState] = useState<{
        isDialogOpen: boolean;
        processTemplateId: string | null;
    }>({
        isDialogOpen: false,
        processTemplateId: null,
    });

    const [processTemplateWizardDialogState, setProcessTemplateWizardDialogState] = useState<{
        isWizardOpen: boolean;
        processTemplate: IMongoProcessTemplatePopulated | null;
    }>({
        isWizardOpen: false,
        processTemplate: null,
    });

    const { isLoading: deleteTemplateIsLoading, mutateAsync: deleteTemplateMutateAsync } = useMutation(
        (id: string) => deleteProcessTemplateRequest(id),
        {
            onSuccess: (_data, id) => {
                queryClient.setQueryData<IProcessTemplateMap>('getProcessTemplates', (processTemplateMap) => {
                    processTemplateMap!.delete(id);
                    return processTemplateMap!;
                });
                setDeleteProcessTemplateDialogState({ isDialogOpen: false, processTemplateId: null });
                toast.success(i18next.t('wizard.processTemplate.deletedSuccessfully'));
            },
            onError: (error: AxiosError) => {
                toast.error(<ErrorToast axiosError={error} defaultErrorMessage={i18next.t('wizard.processTemplate.failedToDelete')} />);
            },
        },
    );

    return (
        <Grid item container marginBottom="30px" gap="30px">
            <Grid container spacing={1} alignItems="center">
                <Grid item>
                    <SearchInput onChange={setSearchText} borderRadius="7px" placeholder={i18next.t('globalSearch.searchProcesses')} />
                </Grid>
                <Grid item>
                    <IconButton
                        style={{ borderRadius: '5px' }}
                        onClick={() => setProcessTemplateWizardDialogState({ isWizardOpen: true, processTemplate: null })}
                    >
                        <img src="icons/Add-New-Process.svg" />
                    </IconButton>
                </Grid>
            </Grid>
            {Array.from(processTemplates.values())
                .filter((processTemplate) => searchText === '' || processTemplate.displayName.includes(searchText))
                .map((processTemplate) => (
                    <ProcessTemplateCard
                        key={processTemplate._id}
                        processTemplate={processTemplate}
                        setDeleteProcessTemplateDialogState={setDeleteProcessTemplateDialogState}
                        setProcessTemplateWizardDialogState={setProcessTemplateWizardDialogState}
                    />
                ))}
            <ProcessTemplateWizard
                open={processTemplateWizardDialogState.isWizardOpen}
                handleClose={() => setProcessTemplateWizardDialogState({ isWizardOpen: false, processTemplate: null })}
                initialValues={processTemplateObjectToProcessTemplateForm(processTemplateWizardDialogState.processTemplate)}
                isEditMode={Boolean(processTemplateWizardDialogState.processTemplate)}
            />
            <AreYouSureDialog
                open={deleteProcessTemplateDialogState.isDialogOpen}
                handleClose={() => setDeleteProcessTemplateDialogState({ isDialogOpen: false, processTemplateId: null })}
                onYes={() => deleteTemplateMutateAsync(deleteProcessTemplateDialogState.processTemplateId!)}
                isLoading={deleteTemplateIsLoading}
            />
        </Grid>
    );
};

export { ProcessTemplatesRow };
