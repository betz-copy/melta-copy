import React, { useState } from 'react';
import { Grid, Card, CardContent, IconButton, Menu, Tooltip, Box } from '@mui/material';
import {
    Delete as DeleteIcon,
    Edit as EditIcon,
    ContentCopy as DuplicateIcon,
    AccountTreeOutlined as GraphIcon,
    MoreVertOutlined,
    DoDisturbAlt,
    VisibilityOff,
    Visibility,
} from '@mui/icons-material';
import { useMutation, useQueryClient } from 'react-query';
import i18next from 'i18next';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';
import { useSelector } from 'react-redux';
import { IMongoEntityTemplatePopulated, IEntityTemplateMap } from '../../../interfaces/entityTemplates';
import { IEntity, IEntityExpanded } from '../../../interfaces/entities';
import { deleteEntityRequest, updateEntityStatusRequest } from '../../../services/entitiesService';
import { AreYouSureDialog } from '../../../common/dialogs/AreYouSureDialog';
import { EntityPropertiesInternal } from '../../../common/EntityProperties';
import { IPermissionsOfUser } from '../../../services/permissionsService';
import { EditEntityDetails } from './EditEntityDetails';
import { ErrorToast } from '../../../common/ErrorToast';
import { MenuButton } from '../../../common/MenuButton';
import { EntityDisableCheckbox } from './EntityDisableCheckbox';
import { EntityDates } from './EntityDates';
import { RootState } from '../../../store';
import { IRuleBreach, IRuleBreachPopulated } from '../../../interfaces/ruleBreaches/ruleBreach';
import UpdateStatusWithRuleBreachDialog from './UpdateStatusWithRuleBreachDialog';

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
    const [hideField, setHideField] = React.useState(true);

    const darkMode = useSelector((state: RootState) => state.darkMode);

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

    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;
    const currentEntityTemplate = entityTemplates.get(expandedEntity?.entity.templateId);
    const templateIds = Array.from(entityTemplates.keys());
    const [updateStatusWithRuleBreachDialogState, setUpdateStatusWithRuleBreachDialogState] = useState<{
        isOpen: boolean;
        brokenRules?: IRuleBreachPopulated['brokenRules'];
        rawBrokenRules?: IRuleBreach['brokenRules'];
        disabledStatus?: boolean;
    }>({ isOpen: false });
    const { isLoading: isUpdateStatusLoading, mutateAsync: updateEntityStatus } = useMutation(
        ({ currEntity, disabled, ignoredRules }: { currEntity: IEntity; disabled: boolean; ignoredRules?: IRuleBreach['brokenRules'] }) =>
            updateEntityStatusRequest(currEntity.properties._id, disabled, JSON.stringify(ignoredRules)),
        {
            onSuccess: (data) => {
                queryClient.setQueryData(['getExpandedEntity', entity.properties._id, { templateIds, numberOfConnections: 1 }], () => {
                    return {
                        ...expandedEntity,
                        entity: data,
                    };
                });
                setUpdateStatusWithRuleBreachDialogState({ isOpen: false });

                if (data.properties.disabled) toast.success(i18next.t('entityPage.disabledSuccessfully'));
                else toast.success(i18next.t('entityPage.activatedSuccessfully'));
            },
            onError: (err: AxiosError, { disabled }) => {
                const errorMetadata = err.response?.data?.metadata;
                if (errorMetadata?.errorCode === 'RULE_BLOCK') {
                    setUpdateStatusWithRuleBreachDialogState({
                        isOpen: true,
                        brokenRules: errorMetadata.brokenRules,
                        rawBrokenRules: errorMetadata.rawBrokenRules,
                        disabledStatus: disabled,
                    });
                }
                if (disabled) toast.error(i18next.t('entityPage.failedToDisable'));
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

    if (isEditMode) {
        return (
            <EditEntityDetails
                entityTemplate={entityTemplate}
                entity={expandedEntity.entity}
                onSuccessUpdate={(data) => {
                    setIsEditMode(false);
                    queryClient.setQueryData(['getExpandedEntity', entity.properties._id, { templateIds, numberOfConnections: 1 }], () => {
                        return {
                            ...expandedEntity,
                            entity: data,
                        };
                    });
                }}
                onCancelUpdate={() => setIsEditMode(false)}
            />
        );
    }

    const hasPermissionToCategory = Boolean(myPermissions.instancesPermissions.find((instance) => instance.category === entityTemplate.category._id));
    const isEntityDisabled = expandedEntity.entity.properties.disabled;

    return (
        <>
            <Card style={{ background: darkMode ? '#171717' : 'white', opacity: isEntityDisabled ? '0.666' : '1' }}>
                <CardContent sx={{ '&:last-child': { padding: 0 } }}>
                    <Grid item container justifyContent="space-between" alignItems="stretch" padding="1rem">
                        <Grid item xs={11}>
                            <Box padding="0.2rem">
                                <EntityPropertiesInternal entityTemplate={entityTemplate} properties={entity['properties']} darkMode={darkMode} />
                            </Box>
                        </Grid>
                        <Grid item>
                            <Grid container>
                                {entityTemplate.properties.hide.length > 0 && (
                                    <IconButton onClick={() => setHideField((cur) => !cur)}>
                                        {hideField ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                )}
                                <IconButton onClick={handleClick}>
                                    <MoreVertOutlined />
                                </IconButton>
                                <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
                                    <Grid>
                                        <MenuButton
                                            onClick={() => {
                                                navigate(`/entity/${entity.properties._id}/graph`);
                                                handleClose();
                                            }}
                                            text={i18next.t('actions.graph')}
                                            icon={<GraphIcon color="action" />}
                                        />
                                    </Grid>
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

                                    <Grid>
                                        <MenuButton
                                            onClick={() => {
                                                navigate(`/entity/${entity.properties._id}/duplicate`, {
                                                    state: { entityTemplate, expandedEntity, currentEntityTemplate },
                                                });
                                                handleClose();
                                            }}
                                            text={i18next.t('actions.duplicate')}
                                            icon={<DuplicateIcon color="action" />}
                                        />
                                    </Grid>
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
                                            updateEntityStatus({ currEntity: entity, disabled: !entity.properties.disabled });
                                            handleClose();
                                        }}
                                        disabled={!hasPermissionToCategory}
                                        text={isEntityDisabled ? i18next.t('actions.activate') : i18next.t('actions.disable')}
                                        icon={<DoDisturbAlt color="action" />}
                                    />
                                </Menu>
                            </Grid>
                        </Grid>

                        <Grid container>
                            <EntityDisableCheckbox isEntityDisabled={isEntityDisabled}> </EntityDisableCheckbox>
                        </Grid>
                        <EntityDates createdAt={expandedEntity.entity.properties.createdAt} updatedAt={expandedEntity.entity.properties.updatedAt} />
                    </Grid>
                </CardContent>

                <AreYouSureDialog
                    open={openDeleteDialog}
                    handleClose={closeDeleteDialog}
                    onYes={() => deleteMutation()}
                    isLoading={isDeleteLoading}
                />
            </Card>
            {updateStatusWithRuleBreachDialogState.isOpen && (
                <UpdateStatusWithRuleBreachDialog
                    isLoadingUpdateEntity={isUpdateStatusLoading}
                    handleClose={() => setUpdateStatusWithRuleBreachDialogState({ isOpen: false })}
                    onUpdateStatus={() => {
                        return updateEntityStatus({
                            currEntity: entity,
                            disabled: updateStatusWithRuleBreachDialogState.disabledStatus!,
                            ignoredRules: updateStatusWithRuleBreachDialogState.rawBrokenRules!,
                        });
                    }}
                    brokenRules={updateStatusWithRuleBreachDialogState.brokenRules!}
                    rawBrokenRules={updateStatusWithRuleBreachDialogState.rawBrokenRules!}
                    currEntity={expandedEntity.entity}
                    disabled={updateStatusWithRuleBreachDialogState.disabledStatus!}
                    onUpdatedRuleBlock={(brokenRules) =>
                        setUpdateStatusWithRuleBreachDialogState((prevState) => ({
                            ...prevState,
                            brokenRules,
                        }))
                    }
                />
            )}
        </>
    );
};

export { EntityDetails };
