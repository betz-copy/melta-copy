import { IServerSideSelectionState, IStatusPanelParams } from '@ag-grid-community/core';
import { Delete } from '@mui/icons-material';
import { CircularProgress, Grid, Typography } from '@mui/material';
import { AxiosError } from 'axios';
import i18next from 'i18next';
import React, { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { IDeleteEntityBody, IMongoEntityTemplatePopulated } from '@microservices/shared-interfaces';
import { BackendConfigState } from '../../services/backendConfigService';
import { deleteEntityRequest } from '../../services/entitiesService';
import { useUserStore } from '../../stores/user';
import { filterModelToFilterOfTemplate } from '../../utils/agGrid/agGridToSearchEntitiesOfTemplateRequest';
import { isWorkspaceAdmin } from '../../utils/permissions/instancePermissions';
import { ErrorToast } from '../ErrorToast';
import { TableButton } from '../TableButton';
import { DeleteEntitiesDialog } from './DeleteEntitiesDialog';

interface MultiSelectStatusBarProps extends IStatusPanelParams {
    template: IMongoEntityTemplatePopulated;
    quickFilterText: string;
}

export const MultiSelectStatusBar: React.FC<MultiSelectStatusBarProps> = ({ api, template, quickFilterText }) => {
    const queryClient = useQueryClient();
    const { deleteEntitiesLimit } = queryClient.getQueryData<BackendConfigState>('getBackendConfig')!;

    const currentUser = useUserStore((state) => state.user);
    const workspaceAdmin = isWorkspaceAdmin(currentUser.currentWorkspacePermissions);

    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [selectedRowCount, setSelectedRowCount] = useState(0);
    const [confirmDeleteDisplayNameValue, setConfirmDeleteDisplayNameValue] = useState('');

    const { isLoading: isDeleteLoading, mutateAsync: deleteMutation } = useMutation(
        (deleteBody: IDeleteEntityBody) => deleteEntityRequest(deleteBody),
        {
            onError: (error: AxiosError<{ metadata: { errorCode: string } }>) => {
                toast.error(<ErrorToast axiosError={error} defaultErrorMessage={i18next.t('wizard.entity.failedToDelete')} />);
            },
            onSuccess: () => {
                toast.success(i18next.t('wizard.entity.deletedEntitiesSuccess'));
                api.refreshServerSide();
            },
            onSettled: () => {
                api.deselectAll();
                setConfirmDeleteDisplayNameValue('');
            },
        },
    );

    useEffect(() => {
        const updateSelectedRowCount = () => {
            const { selectAll, toggledNodes } = api.getServerSideSelectionState() as IServerSideSelectionState;

            if (selectAll) {
                const toggledNodesCount = toggledNodes.length;
                setSelectedRowCount(api.getDisplayedRowCount() - toggledNodesCount);
            } else setSelectedRowCount(api.getSelectedRows().length);
        };

        api.addEventListener('selectionChanged', updateSelectedRowCount);
        updateSelectedRowCount();

        return () => api.removeEventListener('selectionChanged', updateSelectedRowCount);
    }, [api]);

    const handleMultipleDelete = (deleteAllRelationships = false) => {
        const { selectAll, toggledNodes } = api.getServerSideSelectionState() as IServerSideSelectionState;
        const { _id: templateId } = template;
        let deleteBody: IDeleteEntityBody<boolean>;

        if (selectAll) {
            deleteBody = {
                selectAll: true,
                idsToExclude: toggledNodes,
                deleteAllRelationships,
                templateId,
                filter: filterModelToFilterOfTemplate(api.getFilterModel(), template),
                textSearch: quickFilterText,
            } as IDeleteEntityBody<true>;
        } else {
            const selectedRowsIds = api.getSelectedRows().map((row) => row.properties._id);
            deleteBody = {
                selectAll: false,
                idsToInclude: selectedRowsIds,
                deleteAllRelationships,
                templateId,
            } as IDeleteEntityBody<false>;
        }

        deleteMutation(deleteBody);
        setOpenDeleteDialog(false);
    };

    return (
        <Grid>
            <Grid container spacing={2} alignItems="center">
                <Grid item>
                    <TableButton
                        iconButtonWithPopoverProps={{
                            popoverText: i18next.t('actions.delete'),
                            iconButtonProps: {
                                onClick: () => setOpenDeleteDialog(true),
                                sx: {
                                    fontSize: '15px',
                                    marginTop: '6px',
                                },
                            },
                        }}
                        icon={isDeleteLoading ? <CircularProgress /> : <Delete fontSize="small" />}
                        text={i18next.t('actions.delete')}
                        disableButton={selectedRowCount === 0 || selectedRowCount >= deleteEntitiesLimit}
                    />
                </Grid>

                <Grid item>
                    <Typography sx={{ color: 'warning.main' }} variant="caption" fontSize="14px">
                        {i18next.t(
                            workspaceAdmin
                                ? 'entitiesTableOfTemplate.deleteWithRelationshipReferenceWarn'
                                : 'entitiesTableOfTemplate.deleteWithRelationshipWarn',
                        )}
                    </Typography>
                </Grid>

                {selectedRowCount >= deleteEntitiesLimit && (
                    <Grid item>
                        <Typography color="error" variant="caption" fontSize="14px">
                            {i18next.t('entitiesTableOfTemplate.cantDeleteMoreThen', { limit: deleteEntitiesLimit })}
                        </Typography>
                    </Grid>
                )}
            </Grid>

            <DeleteEntitiesDialog
                open={openDeleteDialog}
                handleClose={() => {
                    setOpenDeleteDialog(false);
                    setConfirmDeleteDisplayNameValue('');
                }}
                onYes={() => handleMultipleDelete(workspaceAdmin)}
                isLoading={isDeleteLoading}
                entityTemplate={template}
                value={confirmDeleteDisplayNameValue}
                setValue={setConfirmDeleteDisplayNameValue}
            />
        </Grid>
    );
};
