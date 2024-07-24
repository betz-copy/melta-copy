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
import { InfiniteScroll } from '../../../../common/InfiniteScroll';
import { environment } from '../../../../globals';

const { infiniteScrollPageCount } = environment.processInstances;

const ProcessTemplatesRow: React.FC = () => {
    const queryClient = useQueryClient();
    const processTemplates = queryClient.getQueryData<IMongoProcessTemplatePopulated[]>('getProcessTemplates')!;

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

    const refetch = () => queryClient.invalidateQueries({ queryKey: ['searchProcessTemplates', searchText], exact: true });

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
                queryFunction={async ({ pageParam }) =>
                    Array.from(processTemplates.values())
                        .filter((processTemplate) => searchText === '' || processTemplate.displayName.includes(searchText))
                        .splice(pageParam, infiniteScrollPageCount)
                }
                onQueryError={(error) => {
                    // eslint-disable-next-line no-console
                    console.log('failed to search process templates error:', error);
                    toast.error(i18next.t('entitiesCardView.failedToLoadResults'));
                }}
                getItemId={(processTemplate) => processTemplate._id}
                getNextPageParam={(lastPage, allPages) => {
                    const nextPage = allPages.length * infiniteScrollPageCount;
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
                        refetchQuery={refetch}
                    />
                )}
            </InfiniteScroll>
            <ProcessTemplateWizard
                open={processTemplateWizardDialogState.isWizardOpen}
                handleClose={() => setProcessTemplateWizardDialogState({ isWizardOpen: false, processTemplate: null })}
                initialValues={processTemplateObjectToProcessTemplateForm(processTemplateWizardDialogState.processTemplate)}
                isEditMode={Boolean(processTemplateWizardDialogState.processTemplate)}
                refetchQuery={refetch}
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
