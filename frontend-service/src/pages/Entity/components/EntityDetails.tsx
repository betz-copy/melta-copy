import React, { useState } from 'react';
import { Grid, Card, CardContent, IconButton, Menu, Tooltip, Box } from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon, AccountTreeOutlined as GraphIcon, MoreVertOutlined, DoDisturbAlt } from '@mui/icons-material';
import { useMutation, useQueryClient } from 'react-query';
import i18next from 'i18next';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { IEntityExpanded } from '../../../interfaces/entities';
import { deleteEntityRequest, updateEntityStatusRequest } from '../../../services/entitiesService';
import { AreYouSureDialog } from '../../../common/dialogs/AreYouSureDialog';
import { EntityProperties } from '../../../common/EntityProperties';
import { IPermissionsOfUser } from '../../../services/permissionsService';
import { EditEntityDetails } from './EditEntityDetails';
import { ErrorToast } from '../../../common/ErrorToast';
import { MenuButton } from '../../../common/MenuButton';
import { EntityDisableCheckbox } from './EntityDisableCheckbox';
import { EntityDates } from './EntityDates';

const EntityDetails: React.FC<{ entityTemplate: IMongoEntityTemplatePopulated; expandedEntity: IEntityExpanded }> = ({
    entityTemplate,
    expandedEntity,
}) => {
    const { entity } = expandedEntity;
    const navigate = useNavigate();
    const [isEditMode, setIsEditMode] = useState(false);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const queryClient = useQueryClient();
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const myPermissions = queryClient.getQueryData<IPermissionsOfUser>('getMyPermissions')!;

    const closeDeleteDialog = () => {
        setOpenDeleteDialog(false);
    };

    const entityTemplates = queryClient.getQueryData<IMongoEntityTemplatePopulated[]>('getEntityTemplates')!;
    const currentEntityTemplate = entityTemplates.find((currTemplate) => currTemplate._id === expandedEntity?.entity.templateId);

    const { mutateAsync: updateEntityStatus } = useMutation(
        ({ entityId, disabled }: { entityId: string; disabled: boolean }) => updateEntityStatusRequest(entityId, disabled),
        {
            onSuccess: (data) => {
                const templateIds = entityTemplates.map((template) => template._id);
                queryClient.setQueryData(['getExpandedEntity', entity.properties._id, { templateIds, numberOfConnections: 1 }], () => {
                    return {
                        ...expandedEntity,
                        entity: data,
                    };
                });

                if (data.properties.disabled) toast.success(i18next.t('entityPage.disabledSuccessfully'));
                else toast.success(i18next.t('entityPage.activatedSuccessfully'));
            },
            onError: (_err, variables) => {
                if (variables.disabled) toast.error(i18next.t('entityPage.failedToDisable'));
                else toast.error(i18next.t('entityPage.failedToActivate'));
            },
        },
    );

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

    const hasPermissionToCategory = Boolean(myPermissions.instancesPermissions.find((instance) => instance.category === entityTemplate.category._id));
    const isEntityDisabled = expandedEntity.entity.properties.disabled;

    return (
        <Card style={{ background: isEntityDisabled ? 'rgb(159 147 147 / 16%)' : 'white' }}>
            <CardContent sx={{ '&:last-child': { padding: 0 } }}>
                <Grid item container justifyContent="space-between" alignItems="stretch" padding="1rem">
                    <Grid item xs={11.5}>
                        <Box padding="0.2rem">
                            <EntityProperties entityTemplate={entityTemplate} properties={entity.properties} />
                        </Box>
                    </Grid>
                    <Grid item>
                        <Grid container>
                            <IconButton onClick={handleClick}>
                                <MoreVertOutlined />
                            </IconButton>
                            <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
                                <MenuButton
                                    onClick={() => {
                                        navigate(`/entity/${entity.properties._id}/graph`);
                                        handleClose();
                                    }}
                                    text={i18next.t('actions.graph')}
                                    icon={<GraphIcon color="action" />}
                                />

                                <Tooltip
                                    arrow
                                    placement="right"
                                    title={
                                        isEntityDisabled
                                            ? (i18next.t('entityPage.disabledEntity') as string)
                                            : (i18next.t('permissions.dontHavePermissionsToCategory') as string)
                                    }
                                    disableHoverListener={!isEntityDisabled && hasPermissionToCategory}
                                >
                                    <Grid>
                                        <MenuButton
                                            onClick={(e) => {
                                                if (isEntityDisabled) e.preventDefault();
                                                else {
                                                    setIsEditMode(true);
                                                    handleClose();
                                                }
                                            }}
                                            text={i18next.t('actions.edit')}
                                            icon={<EditIcon color="action" />}
                                        />
                                    </Grid>
                                </Tooltip>

                                <Tooltip
                                    arrow
                                    title={i18next.t('permissions.dontHavePermissionsToCategory') as string}
                                    disableHoverListener={hasPermissionToCategory}
                                    placement="right"
                                >
                                    <Grid>
                                        <MenuButton
                                            onClick={() => {
                                                setOpenDeleteDialog(true);
                                                handleClose();
                                            }}
                                            disabled={!hasPermissionToCategory}
                                            text={i18next.t('actions.delete')}
                                            icon={<DeleteIcon color="action" />}
                                        />
                                    </Grid>
                                </Tooltip>

                                <MenuButton
                                    onClick={() => {
                                        updateEntityStatus({
                                            entityId: entity.properties._id,
                                            disabled: !entity.properties.disabled,
                                        });
                                        handleClose();
                                    }}
                                    disabled={!hasPermissionToCategory}
                                    text={isEntityDisabled ? i18next.t('actions.activate') : i18next.t('actions.disable')}
                                    icon={<DoDisturbAlt color="action" />}
                                />
                            </Menu>
                        </Grid>
                    </Grid>
                    <EntityDisableCheckbox isEntityDisabled={isEntityDisabled}> </EntityDisableCheckbox>
                    <EntityDates createdAt={expandedEntity.entity.properties.createdAt} updatedAt={expandedEntity.entity.properties.updatedAt} />
                </Grid>
            </CardContent>

            <AreYouSureDialog open={openDeleteDialog} handleClose={closeDeleteDialog} onYes={() => deleteMutation()} isLoading={isDeleteLoading} />
        </Card>
    );
};

export { EntityDetails };
