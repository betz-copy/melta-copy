import React, { useState } from 'react';
import { Grid, Card, CardContent, IconButton, Typography, Box } from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon, AccountTreeOutlined as GraphIcon } from '@mui/icons-material';
import { useMutation, useQueryClient } from 'react-query';
import i18next from 'i18next';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { IEntityExpanded } from '../../../interfaces/entities';
import { deleteEntityRequest } from '../../../services/entitiesService';
import { AreYouSureDialog } from '../../../common/dialogs/AreYouSureDialog';
import { EntityProperties } from '../../../common/EntityProperties';
import { IPermissionsOfUser } from '../../../services/permissionsService';
import IconButtonWithPopoverText from '../../../common/IconButtonWithPopover';
import { EditEntityDetails } from './EditEntityDetails';
import { ErrorToast } from '../../../common/ErrorToast';

const EntityDetails: React.FC<{ entityTemplate: IMongoEntityTemplatePopulated; expandedEntity: IEntityExpanded }> = ({
    entityTemplate,
    expandedEntity,
}) => {
    const { entity } = expandedEntity;
    const navigate = useNavigate();
    const [isEditMode, setIsEditMode] = useState(false);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const queryClient = useQueryClient();

    const myPermissions = queryClient.getQueryData<IPermissionsOfUser>('getMyPermissions')!;

    const closeDeleteDialog = () => {
        setOpenDeleteDialog(false);
    };

    const entityTemplates = queryClient.getQueryData<IMongoEntityTemplatePopulated[]>('getEntityTemplates')!;
    const currentEntityTemplate = entityTemplates.find((currTemplate) => currTemplate._id === expandedEntity?.entity.templateId);

    const { isLoading: isDeleteLoading, mutateAsync: deleteMutation } = useMutation(() => deleteEntityRequest(entity.properties._id), {
        onError: (error: AxiosError) => {
            closeDeleteDialog();
            toast.error(<ErrorToast axiosError={error} defaultErrorMessage={i18next.t('wizard.entity.failedToDelete')} />);
        },
        onSuccess: () => {
            toast.success(i18next.t('wizard.entity.deletedSuccessfully'));
            closeDeleteDialog();
            navigate(`/category/${currentEntityTemplate?.category._id}`);
        },
    });

    if (isEditMode) return <EditEntityDetails entityTemplate={entityTemplate} setIsEditMode={setIsEditMode} expandedEntity={expandedEntity} />;

    const disabled = Boolean(!myPermissions.instancesPermissions.find((instance) => instance.category === entityTemplate.category._id));

    return (
        <Card>
            <CardContent sx={{ '&:last-child': { padding: 0 } }}>
                <Grid item container justifyContent="space-between" alignItems="stretch" wrap="nowrap" overflow="auto" padding="1rem">
                    <Grid item container direction="column" justifyContent="space-between">
                        <Box padding="0.2rem">
                            <EntityProperties entityTemplate={entityTemplate} properties={entity.properties} />
                        </Box>
                        <Grid item container justifyContent="space-around">
                            <Typography color="gray">
                                {`${i18next.t('entityPage.createdAt')}: ${new Date(expandedEntity.entity.properties.createdAt).toLocaleString(
                                    'en-uk',
                                )}`}
                            </Typography>
                            <Typography color="gray">
                                {`${i18next.t('entityPage.updatedAt')}: ${new Date(expandedEntity.entity.properties.updatedAt).toLocaleString(
                                    'en-uk',
                                )}`}
                            </Typography>
                        </Grid>
                    </Grid>
                    <Grid item>
                        <Grid container direction="column" justifyContent="space-evenly">
                            <IconButton onClick={() => navigate(`/entity/${entity.properties._id}/graph`, { state: expandedEntity })}>
                                <GraphIcon />
                            </IconButton>
                            <IconButtonWithPopoverText
                                popoverText={i18next.t('permissions.dontHavePermissionsToCategory')}
                                disabledToolTip={!disabled}
                                iconButtonProps={{ onClick: () => setIsEditMode(true), disabled }}
                            >
                                <EditIcon />
                            </IconButtonWithPopoverText>
                            <IconButtonWithPopoverText
                                popoverText={i18next.t('permissions.dontHavePermissionsToCategory')}
                                disabledToolTip={!disabled}
                                iconButtonProps={{ onClick: () => setOpenDeleteDialog(true), disabled }}
                            >
                                <DeleteIcon />
                            </IconButtonWithPopoverText>
                        </Grid>
                    </Grid>
                </Grid>
            </CardContent>
            <AreYouSureDialog open={openDeleteDialog} handleClose={closeDeleteDialog} onYes={() => deleteMutation()} isLoading={isDeleteLoading} />
        </Card>
    );
};

export { EntityDetails };
