import React, { useState } from 'react';
import { IStatusPanelParams } from '@ag-grid-community/core';
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

const MultiSelectStatusBar: React.FC<IStatusPanelParams> = ({ api }) => {
    const theme = useTheme();

    const [openRelationshipDialog, setOpenRelationshipDialog] = useState(false);

    const { isLoading: isDeleteLoading, mutateAsync: deleteMutation } = useMutation(
        ({ ids, deleteAllRelationships }: IDeleteEntityBody) => deleteEntityRequest({ ids, deleteAllRelationships }),
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
        const selectedRows = api.getSelectedRows();
        const ids = selectedRows.map((row) => row.properties._id);
        deleteMutation({ ids, deleteAllRelationships });
    };

    const handleDeleteClick = () => {
        deleteSelectedRows();
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
                    onClick: handleDeleteClick,
                }}
                style={{
                    display: 'flex',
                    gap: '0.25rem',
                    borderRadius: '5px',
                    fontSize: '15px',
                    color: theme.palette.primary.main,
                }}
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

export { MultiSelectStatusBar };
