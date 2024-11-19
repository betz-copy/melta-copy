import React, { useEffect, useState } from 'react';
import { IServerSideSelectionState, IStatusPanelParams } from '@ag-grid-community/core';
import { Box, CircularProgress, Grid, Typography, useTheme } from '@mui/material';
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

interface MultiSelectStatusBarProps extends IStatusPanelParams {
    templateId: string;
}

export const MultiSelectStatusBar: React.FC<MultiSelectStatusBarProps> = ({ api, templateId }) => {
    const theme = useTheme();
    const [openRelationshipDialog, setOpenRelationshipDialog] = useState(false);
    const [selectedRowCount, setSelectedRowCount] = useState(0);
    console.log({ selectedRowCount });

    useEffect(() => {
        const updateSelectedRowCount = () => setSelectedRowCount(api.getSelectedRows().length);

        api.addEventListener('selectionChanged', updateSelectedRowCount);
        updateSelectedRowCount();

        return () => api.removeEventListener('selectionChanged', updateSelectedRowCount);
    }, [api]);

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

    const handleClose = () => {
        setOpenRelationshipDialog(false);
        api.deselectAll();
    };

    const deleteSelectedRows = (deleteAllRelationships = false) => {
        const { selectAll, toggledNodes } = api.getServerSideSelectionState() as IServerSideSelectionState;

        if (selectAll) deleteMutation({ ids: toggledNodes, selectAll, deleteAllRelationships, templateId });
        else {
            const selectedRows = api.getSelectedRows();
            const ids = selectedRows.map((row) => row.properties._id);
            deleteMutation({ ids, selectAll: false, deleteAllRelationships, templateId });
        }
    };

    const handleYesDeleteWithRelationships = () => {
        deleteSelectedRows(true);
        handleClose();
    };

    return (
        <Grid>
            <IconButtonWithPopover
                popoverText={i18next.t('actions.delete')}
                iconButtonProps={{
                    onClick: () => deleteSelectedRows(),
                }}
                style={{
                    display: 'flex',
                    gap: '0.25rem',
                    borderRadius: '5px',
                    fontSize: '15px',
                    color: theme.palette.primary.main,
                    marginTop: 5,
                }}
                // disabled={selectedRowCount === 0}
            >
                <>
                    {isDeleteLoading ? <CircularProgress /> : <Delete fontSize="small" />}
                    {i18next.t('actions.delete')}
                </>
            </IconButtonWithPopover>

            <AreYouSureDialog
                open={openRelationshipDialog}
                handleClose={handleClose}
                title={i18next.t('entityPage.payAttention')}
                body={i18next.t('entityPage.wouldYouLikeToDeleteTheRelationships')}
                onYes={handleYesDeleteWithRelationships}
            />
        </Grid>
    );
};
