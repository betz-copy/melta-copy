import React, { useCallback, useEffect, useState } from 'react';
import { IServerSideSelectionState, IStatusPanelParams } from '@ag-grid-community/core';
import { CircularProgress, Grid, Typography, useTheme } from '@mui/material';
import { Delete } from '@mui/icons-material';
import i18next from 'i18next';
import { useMutation } from 'react-query';
import { AxiosError } from 'axios';
import { toast } from 'react-toastify';
import { deleteEntityRequest } from '../../services/entitiesService';
import { AreYouSureDialog } from '../dialogs/AreYouSureDialog';
import { ErrorToast } from '../ErrorToast';
import { IDeleteEntityBody } from '../../interfaces/entities';
import { IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import { filterModelToFilterOfTemplate } from '../../utils/agGrid/agGridToSearchEntitiesOfTemplateRequest';
import { environment } from '../../globals';
import { TableButton } from '../TableButton';
import { useUserStore } from '../../stores/user';
import { PermissionScope } from '../../interfaces/permissions';

interface MultiSelectStatusBarProps extends IStatusPanelParams {
    entityTemplate: IMongoEntityTemplatePopulated;
    quickFilterText: string;
}

export const MultiSelectStatusBar: React.FC<MultiSelectStatusBarProps> = ({ api, entityTemplate, quickFilterText }) => {
    const currentUser = useUserStore((state) => state.user);

    const [openRelationshipDialog, setOpenRelationshipDialog] = useState(false);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [selectedRowCount, setSelectedRowCount] = useState(0);

    const updateSelectedRowCount = useCallback(() => {
        const { selectAll, toggledNodes } = api.getServerSideSelectionState() as IServerSideSelectionState;

        if (selectAll) {
            const toggledNodesCount = toggledNodes.length;
            setSelectedRowCount(api.getDisplayedRowCount() - toggledNodesCount);
        } else setSelectedRowCount(api.getSelectedRows().length);
    }, [api]);

    useEffect(() => {
        api.addEventListener('selectionChanged', updateSelectedRowCount);
        updateSelectedRowCount();

        return () => api.removeEventListener('selectionChanged', updateSelectedRowCount);
    }, [api, updateSelectedRowCount]);

    const { isLoading: isDeleteLoading, mutateAsync: deleteMutation } = useMutation(
        (deleteBody: IDeleteEntityBody) => deleteEntityRequest(deleteBody),
        {
            onError: (error: AxiosError) => {
                const errorIdentifier = error.response?.data?.metadata?.errorCode;

                if (
                    errorIdentifier === 'ENTITY_HAS_RELATIONSHIPS' &&
                    currentUser.currentWorkspacePermissions.admin?.scope === PermissionScope.write
                ) {
                    setOpenRelationshipDialog(true);
                } else {
                    toast.error(<ErrorToast axiosError={error} defaultErrorMessage={i18next.t('wizard.entity.failedToDelete')} />);
                    api.deselectAll();
                }
            },
            onSuccess: () => {
                toast.success(i18next.t('wizard.entity.deletedSuccessfully'));
                api.refreshServerSide();
                api.deselectAll();
            },
        },
    );

    const handleMultipleDelete = (deleteAllRelationships = false) => {
        const { selectAll, toggledNodes } = api.getServerSideSelectionState() as IServerSideSelectionState;
        const { _id: templateId } = entityTemplate;

        if (selectAll) {
            deleteMutation({
                selectAll,
                ids: toggledNodes,
                deleteAllRelationships,
                templateId,
                filter: {
                    ...{
                        disabled: {
                            filterType: 'set',
                            values: [false],
                        },
                    },
                    ...filterModelToFilterOfTemplate(api.getFilterModel(), entityTemplate),
                },
                textSearch: quickFilterText,
            });
        } else {
            const selectedRowsIds = api.getSelectedRows().map((row) => row.properties._id);
            deleteMutation({ selectAll: false, ids: selectedRowsIds, deleteAllRelationships, templateId });
        }

        setOpenDeleteDialog(false);
    };

    const handleCloseRelationshipDialog = () => {
        setOpenRelationshipDialog(false);
        api.deselectAll();
    };

    const handleCloseDeleteDialog = () => {
        setOpenDeleteDialog(false);
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
                body={i18next.t('entityPage.wouldYouLikeToDeleteTheRelationships')}
                onYes={handleYesDeleteWithRelationships}
            />

            <AreYouSureDialog
                open={openDeleteDialog}
                handleClose={handleCloseDeleteDialog}
                onYes={() => handleMultipleDelete()}
                isLoading={isDeleteLoading}
            />
        </Grid>
    );
};
