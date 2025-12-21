import { Grid } from '@mui/material';
import { IMongoProcessTemplateReviewerPopulated, IProcessTemplateMap } from '@packages/process';
import { AxiosError } from 'axios';
import i18next from 'i18next';
import React, { useState } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { AreYouSureDialog } from '../../../../common/dialogs/AreYouSureDialog';
import { ErrorToast } from '../../../../common/ErrorToast';
import { InfiniteScroll } from '../../../../common/InfiniteScroll';
import SearchInput from '../../../../common/inputs/SearchInput';
import { ProcessTemplateWizard } from '../../../../common/wizards/processTemplate';
import { environment } from '../../../../globals';
import { deleteProcessTemplateRequest, processTemplateObjectToProcessTemplateForm } from '../../../../services/templates/processTemplatesService';
import { CreateButton } from '../CreateButton';
import { ProcessTemplateCard } from './ProcessTemplateCard';

const ProcessTemplatesRow: React.FC = () => {
    const { infiniteScrollPageCount } = environment.processInstances;

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
        processTemplate: IMongoProcessTemplateReviewerPopulated | null;
    }>({
        isWizardOpen: false,
        processTemplate: null,
    });

    const queryClient = useQueryClient();

    const processTemplates = queryClient.getQueryData<IMongoProcessTemplateReviewerPopulated[]>('getProcessTemplates')!;

    const { isLoading: deleteTemplateIsLoading, mutateAsync: deleteTemplateMutateAsync } = useMutation(
        (id: string) => deleteProcessTemplateRequest(id),
        {
            onSuccess: (_data, id) => {
                queryClient.setQueryData<IProcessTemplateMap>('getProcessTemplates', (processTemplateMap) => {
                    processTemplateMap!.delete(id);
                    return processTemplateMap!;
                });
                setDeleteProcessTemplateDialogState({ isDialogOpen: false, processTemplateId: null });
                queryClient.invalidateQueries(['searchProcessTemplates', searchText]);
                toast.success(i18next.t('wizard.processTemplate.deletedSuccessfully'));
            },
            onError: (error: AxiosError) => {
                toast.error(
                    <ErrorToast
                        axiosError={error}
                        defaultErrorMessage={`${i18next.t('wizard.processTemplate.failedToDelete')} ${i18next.t(
                            'wizard.processTemplate.hasInstances',
                        )}`}
                    />,
                );
            },
        },
    );

    return (
        <Grid container marginBottom="30px" gap="30px">
            <Grid container spacing={1} alignItems="center">
                <Grid>
                    <SearchInput onChange={setSearchText} borderRadius="7px" placeholder={i18next.t('globalSearch.searchProcesses')} />
                </Grid>
                <Grid>
                    <CreateButton
                        onClick={() => setProcessTemplateWizardDialogState({ isWizardOpen: true, processTemplate: null })}
                        text={i18next.t('systemManagement.newProcessTemplate')}
                    />
                </Grid>
            </Grid>
            <InfiniteScroll<IMongoProcessTemplateReviewerPopulated>
                queryKey={['searchProcessTemplates', searchText]}
                queryFunction={({ pageParam }) =>
                    Array.from(processTemplates.values())
                        .filter((processTemplate) => searchText === '' || processTemplate.displayName.includes(searchText))
                        .splice(pageParam, infiniteScrollPageCount)
                }
                onQueryError={(error) => {
                    console.error('failed to search process templates error:', error);
                    toast.error(i18next.t('failedToLoadResults'));
                }}
                getItemId={(processTemplate) => processTemplate._id}
                getNextPageParam={(lastPage, allPages) => {
                    const nextPage = allPages.length * infiniteScrollPageCount;
                    return lastPage.length ? nextPage : undefined;
                }}
                endText={i18next.t('noSearchLeft')}
                emptyText={i18next.t('failedToGetTemplates')}
                useContainer={false}
            >
                {(processTemplate) => (
                    <ProcessTemplateCard
                        key={processTemplate._id}
                        processTemplate={processTemplate}
                        setDeleteProcessTemplateDialogState={setDeleteProcessTemplateDialogState}
                        setProcessTemplateWizardDialogState={setProcessTemplateWizardDialogState}
                        setDuplicateProcessTemplateDialogState={setProcessTemplateWizardDialogState}
                    />
                )}
            </InfiniteScroll>
            <ProcessTemplateWizard
                open={processTemplateWizardDialogState.isWizardOpen}
                handleClose={() => setProcessTemplateWizardDialogState({ isWizardOpen: false, processTemplate: null })}
                initialValues={processTemplateObjectToProcessTemplateForm(processTemplateWizardDialogState.processTemplate)}
                isEditMode={Boolean(processTemplateWizardDialogState.processTemplate?._id)}
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

export default ProcessTemplatesRow;
