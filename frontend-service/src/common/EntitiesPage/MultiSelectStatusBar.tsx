import React, { useCallback, useEffect, useState } from 'react';
import { IServerSideSelectionState, IStatusPanelParams } from '@ag-grid-community/core';
import { CircularProgress, Grid, useTheme } from '@mui/material';
import { Delete } from '@mui/icons-material';
import i18next from 'i18next';
import { useMutation } from 'react-query';
import { AxiosError } from 'axios';
import { toast } from 'react-toastify';
import { deleteEntityRequest } from '../../services/entitiesService';
import { AreYouSureDialog } from '../dialogs/AreYouSureDialog';
import { ErrorToast } from '../ErrorToast';
import IconButtonWithPopover from '../IconButtonWithPopover';
import { IDeleteEntityBody } from '../../interfaces/entities';
import { IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import { filterModelToFilterOfTemplate } from '../../utils/agGrid/agGridToSearchEntitiesOfTemplateRequest';

interface MultiSelectStatusBarProps extends IStatusPanelParams {
    entityTemplate: IMongoEntityTemplatePopulated;
    quickFilterText: string;
}

export const MultiSelectStatusBar: React.FC<MultiSelectStatusBarProps> = ({ api, entityTemplate, quickFilterText }) => {
    const theme = useTheme();
    const [openRelationshipDialog, setOpenRelationshipDialog] = useState(false);
    const [selectedRowCount, setSelectedRowCount] = useState(0);

    const updateSelectedRowCount = useCallback(() => {
        const { selectAll, toggledNodes } = api.getServerSideSelectionState() as IServerSideSelectionState;

        if (selectAll) {
            const toggledNodesCount = toggledNodes.length;
            setSelectedRowCount(api.getDisplayedRowCount() - toggledNodesCount);
        } else {
            setSelectedRowCount(api.getSelectedRows().length);
        }
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
                if (errorIdentifier === 'ENTITY_HAS_RELATIONSHIPS') setOpenRelationshipDialog(true);
                else toast.error(<ErrorToast axiosError={error} defaultErrorMessage={i18next.t('wizard.entity.failedToDelete')} />);
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

        if (selectAll) {
            deleteMutation({
                ids: toggledNodes,
                selectAll,
                deleteAllRelationships,
                templateId: entityTemplate._id,
                filter: filterModelToFilterOfTemplate(api.getFilterModel(), entityTemplate),
                textSearch: quickFilterText,
            });
        } else {
            const selectedRowsIds = api.getSelectedRows().map((row) => row.properties._id);
            deleteMutation({ ids: selectedRowsIds, selectAll: false, deleteAllRelationships, templateId: entityTemplate._id });
        }
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
            <IconButtonWithPopover
                popoverText={i18next.t('actions.delete')}
                iconButtonProps={{
                    onClick: () => handleMultipleDelete(),
                }}
                style={{
                    display: 'flex',
                    gap: '0.25rem',
                    borderRadius: '5px',
                    fontSize: '15px',
                    color: theme.palette.primary.main,
                    marginTop: 5,
                }}
                disabled={selectedRowCount === 0}
            >
                <>
                    {isDeleteLoading ? <CircularProgress /> : <Delete fontSize="small" />}
                    {i18next.t('actions.delete')}
                </>
            </IconButtonWithPopover>

            <AreYouSureDialog
                open={openRelationshipDialog}
                handleClose={handleCloseRelationshipDialog}
                title={i18next.t('entityPage.payAttention')}
                body={i18next.t('entityPage.wouldYouLikeToDeleteTheRelationships')}
                onYes={handleYesDeleteWithRelationships}
            />
        </Grid>
    );
};
