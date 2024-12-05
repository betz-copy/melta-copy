import { IServerSideSelectionState, IStatusPanelParams } from '@ag-grid-community/core';
import { Delete } from '@mui/icons-material';
import { CircularProgress, Grid, Typography } from '@mui/material';
import { AxiosError } from 'axios';
import i18next from 'i18next';
import React, { useEffect, useState } from 'react';
import { useMutation } from 'react-query';
import { toast } from 'react-toastify';
import { environment } from '../../globals';
import { IDeleteEntityBody } from '../../interfaces/entities';
import { IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import { deleteEntityRequest } from '../../services/entitiesService';
import { useUserStore } from '../../stores/user';
import { filterModelToFilterOfTemplate } from '../../utils/agGrid/agGridToSearchEntitiesOfTemplateRequest';
import { isWorkspaceAdmin } from '../../utils/permissions/instancePermissions';
import { AreYouSureDialog } from '../dialogs/AreYouSureDialog';
import { ErrorToast } from '../ErrorToast';
import { TableButton } from '../TableButton';
import { DeleteEntitiesDialog } from './DeleteEntitiesDialog';

interface MultiSelectStatusBarProps extends IStatusPanelParams {
    entityTemplate: IMongoEntityTemplatePopulated;
    quickFilterText: string;
}

export const MultiSelectStatusBar: React.FC<MultiSelectStatusBarProps> = ({ api, entityTemplate, quickFilterText }) => {
    const currentUser = useUserStore((state) => state.user);
    const workspaceAdmin = isWorkspaceAdmin(currentUser.currentWorkspacePermissions);

    const [openRelationshipDialog, setOpenRelationshipDialog] = useState(false);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [selectedRowCount, setSelectedRowCount] = useState(0);
    const [confirmDeleteDisplayNameValue, setConfirmDeleteDisplayNameValue] = useState('');

    const { isLoading: isDeleteLoading, mutateAsync: deleteMutation } = useMutation(
        (deleteBody: IDeleteEntityBody) => deleteEntityRequest(deleteBody),
        {
            onError: (error: AxiosError) => {
                const errorIdentifier = error.response?.data?.metadata?.errorCode;

                if (errorIdentifier === 'ENTITY_HAS_RELATIONSHIPS' && workspaceAdmin) setOpenRelationshipDialog(true);
                else {
                    toast.error(<ErrorToast axiosError={error} defaultErrorMessage={i18next.t('wizard.entity.failedToDeleteEntities')} />);
                    api.deselectAll();
                }
            },
            onSuccess: () => {
                toast.success(i18next.t('wizard.entity.deletedEntitiesSuccess'));
                setConfirmDeleteDisplayNameValue('');
                api.refreshServerSide();
                api.deselectAll();
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
        const { _id: templateId } = entityTemplate;
        let deleteBody: IDeleteEntityBody<boolean>;

        if (selectAll) {
            deleteBody = {
                selectAll: true,
                idsToExclude: toggledNodes,
                deleteAllRelationships,
                templateId,
                filter: filterModelToFilterOfTemplate(api.getFilterModel(), entityTemplate),
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

    const handleCloseRelationshipDialog = () => {
        setOpenRelationshipDialog(false);
        api.deselectAll();
    };

    const handleYesDeleteWithRelationships = () => {
        handleMultipleDelete(true);
        handleCloseRelationshipDialog();
    };

    return (
        <Grid>
            <Grid container display="flex" flexDirection="row" alignItems="center" gap="5px">
                <TableButton
                    iconButtonWithPopoverProps={{
                        popoverText: i18next.t('actions.delete'),
                        iconButtonProps: {
                            onClick: () => setOpenDeleteDialog(true),
                            style: {
                                fontSize: '15px',
                                marginTop: 5,
                            },
                        },
                    }}
                    icon={isDeleteLoading ? <CircularProgress /> : <Delete fontSize="small" />}
                    text={i18next.t('actions.delete')}
                    disableButton={selectedRowCount === 0 || selectedRowCount >= environment.agGrid.limitOfDeleteEntities}
                />

                {selectedRowCount >= environment.agGrid.limitOfDeleteEntities && (
                    <Typography color="error" variant="caption" fontSize="14px" marginTop="5px">
                        {`${i18next.t('entitiesTableOfTemplate.cantDeleteMoreThen')}`}
                    </Typography>
                )}
            </Grid>

            <AreYouSureDialog
                open={openRelationshipDialog}
                handleClose={handleCloseRelationshipDialog}
                title={i18next.t('entityPage.payAttention')}
                body={i18next.t('entityPage.wouldYouLikeToDeleteRelationshipsOfEntities')}
                onYes={handleYesDeleteWithRelationships}
            />

            <DeleteEntitiesDialog
                open={openDeleteDialog}
                handleClose={() => {
                    setOpenDeleteDialog(false);
                    setConfirmDeleteDisplayNameValue('');
                }}
                onYes={() => handleMultipleDelete()}
                isLoading={isDeleteLoading}
                entityTemplate={entityTemplate}
                value={confirmDeleteDisplayNameValue}
                setValue={setConfirmDeleteDisplayNameValue}
            />
        </Grid>
    );
};
