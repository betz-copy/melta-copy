import React, { useState } from 'react';
import { Grid, IconButton } from '@mui/material';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import i18next from 'i18next';
import { AxiosError } from 'axios';
import { ProcessTemplateWizard } from '../../../../common/wizards/processTemplate';
import {
    deleteProcessTemplateRequest,
    processTemplateObjectToProcessTemplateForm,
    searchProcessTemplates,
} from '../../../../services/templates/processTemplatesService';
import { AreYouSureDialog } from '../../../../common/dialogs/AreYouSureDialog';
import { ErrorToast } from '../../../../common/ErrorToast';
import SearchInput from '../../../../common/inputs/SearchInput';
import { IMongoProcessTemplatePopulated, IProcessTemplateMap } from '../../../../interfaces/processes/processTemplate';
import { ProcessTemplateCard } from './ProcessTemplateCard';
import { InfiniteScroll } from '../../../../common/InfiniteScroll';
import { environment } from '../../../../globals';

const { infiniteScrollPageCount } = environment.processInstances;

const ProcessTemplatesRow: React.FC = () => {
    const queryClient = useQueryClient();
    const [searchText, setSearchText] = useState('');

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
            <InfiniteScroll<IMongoProcessTemplatePopulated>
                queryKey={['searchProcessTemplates', searchText]}
                queryFunction={async ({ pageParam: startRow = 0 }) => {
                    const searchProcessTemplatesResult = await searchProcessTemplates({
                        skip: startRow,
                        limit: infiniteScrollPageCount,
                        displayName: searchText.length > 0 ? searchText : undefined,
                    });

                    return searchProcessTemplatesResult;
                }}
                onQueryError={(error) => {
                    // eslint-disable-next-line no-console
                    console.log('failed to search process templates error:', error);
                    toast.error(i18next.t('entitiesCardView.failedToLoadResults'));
                }}
                getItemId={(processTemplate) => processTemplate._id}
                getNextPageParam={(lastPage, allPages) => {
                    const nextPage = allPages.length * infiniteScrollPageCount;
                    console.log('process templates', { nextPage, allPages, lastPage });

                    return lastPage.length ? nextPage : undefined;
                }}
                endText={i18next.t('entitiesCardView.noSearchLeft')}
                emptyText={i18next.t('failedToGetTemplates')}
                useContainer={false}
            >
                {(processTemplate) => (
                    <ProcessTemplateCard
                        key={processTemplate._id}
                        processTemplate={processTemplate}
                        setDeleteProcessTemplateDialogState={setDeleteProcessTemplateDialogState}
                        setProcessTemplateWizardDialogState={setProcessTemplateWizardDialogState}
                    />
                )}
            </InfiniteScroll>
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
