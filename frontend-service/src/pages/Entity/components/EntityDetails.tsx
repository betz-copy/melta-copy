import { Card, CardContent, Dialog, Grid, IconButton, Menu } from '@mui/material';
import {
    ContentCopy as DuplicateIcon,
    Delete as DeleteIcon,
    DoNotDisturbOnOutlined as DoNotDisturbOnOutlinedIcon,
    DoNotDisturbOffOutlined as DoNotDisturbOffOutlinedIcon,
    MoreVertOutlined,
    Unarchive,
    Archive,
} from '@mui/icons-material';
import { AxiosError } from 'axios';
import i18next from 'i18next';
import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import MapIcon from '@mui/icons-material/Map';
import { AreYouSureDialog } from '../../../common/dialogs/AreYouSureDialog';
import { ExportFormats } from '../../../common/dialogs/entity/ExportFormats';
import { EntityProperties } from '../../../common/EntityProperties';
import { ErrorToast } from '../../../common/ErrorToast';
import IconButtonWithPopover from '../../../common/IconButtonWithPopover';
import { ImageWithDisable } from '../../../common/ImageWithDisable';
import { IDeleteEntityBody, IEntity, IEntityExpanded } from '../../../interfaces/entities';
import { IEntityTemplateMap, IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { PermissionScope } from '../../../interfaces/permissions';
import { IRuleBreach, IRuleBreachPopulated } from '../../../interfaces/ruleBreaches/ruleBreach';
import { deleteEntityRequest, updateEntityStatusRequest } from '../../../services/entitiesService';
import { useDarkModeStore } from '../../../stores/darkMode';
import { useUserStore } from '../../../stores/user';
import { checkUserTemplatePermission, isWorkspaceAdmin } from '../../../utils/permissions/instancePermissions';
import { EditEntityDetails } from './EditEntityDetails';
import { EntityDates } from './EntityDates';
import { EntityDisableCheckbox } from './EntityDisableCheckbox';
import TooltipMenuButton from './TooltipMenuButton';
import UpdateStatusWithRuleBreachDialog from './UpdateStatusWithRuleBreachDialog';
import LocationPreview from '../../Map/LocationPreview';

const EntityDetails: React.FC<{ entityTemplate: IMongoEntityTemplatePopulated; expandedEntity: IEntityExpanded; childTemplateId?: string }> = ({
    entityTemplate,
    expandedEntity,
    childTemplateId,
}) => {
    const { entity } = expandedEntity;
    const [_, navigate] = useLocation();
    const [isEditMode, setIsEditMode] = useState(false);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [mapDialogOpen, setMapDialogOpen] = useState(false);
    const queryClient = useQueryClient();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [displayArchiveProperties, setDisplayArchiveProperties] = useState(false);

    const [updateStatusWithRuleBreachDialogState, setUpdateStatusWithRuleBreachDialogState] = useState<{
        isOpen: boolean;
        brokenRules?: IRuleBreachPopulated['brokenRules'];
        rawBrokenRules?: IRuleBreach['brokenRules'];
        disabledStatus?: boolean;
    }>({ isOpen: false });

    const currentUser = useUserStore((state) => state.user);
    const darkMode = useDarkModeStore((state) => state.darkMode);

    const open = Boolean(anchorEl);

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const closeDeleteDialog = () => {
        setOpenDeleteDialog(false);
    };

    const entityDetailTooltipTitle = (canWriteInstance: boolean, isEntityDisabled: boolean) => {
        // eslint-disable-next-line no-nested-ternary
        return !canWriteInstance
            ? i18next.t('permissions.dontHaveWritePermissionsToTemplate')
            : isEntityDisabled
            ? i18next.t('entityPage.disabledEntity')
            : '';
    };

    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;
    const currentEntityTemplate = entityTemplates.get(expandedEntity?.entity.templateId);
    const templateIds = Array.from(entityTemplates.keys());

    const workspaceAdmin = isWorkspaceAdmin(currentUser.currentWorkspacePermissions);
    const canWriteInstance = checkUserTemplatePermission(
        currentUser.currentWorkspacePermissions,
        entityTemplate.category,
        entityTemplate._id,
        PermissionScope.write,
    );
    const isEntityDisabled = expandedEntity.entity.properties.disabled || entityTemplate.disabled;
    const includeLocationProperty = Object.entries(entityTemplate.properties.properties).some(
        ([field, property]) => property.format === 'location' && entity.properties[field] !== undefined,
    );

    const { isLoading: isUpdateStatusLoading, mutateAsync: updateEntityStatus } = useMutation(
        ({ currEntity, disabled, ignoredRules }: { currEntity: IEntity; disabled: boolean; ignoredRules?: IRuleBreach['brokenRules'] }) =>
            updateEntityStatusRequest(currEntity.properties._id, disabled, JSON.stringify(ignoredRules)),
        {
            onSuccess: (data) => {
                queryClient.setQueryData(['getExpandedEntity', entity.properties._id, { [entity.properties._id]: 1 }, { templateIds }], () => {
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

    const { isLoading: isDeleteLoading, mutateAsync: deleteMutation } = useMutation(
        () =>
            deleteEntityRequest({
                selectAll: false,
                templateId: currentEntityTemplate?._id as string,
                idsToInclude: [entity.properties._id],
                deleteAllRelationships: expandedEntity.connections.length > 0 && workspaceAdmin,
            } as IDeleteEntityBody<false>),
        {
            onError: (error: AxiosError) => {
                closeDeleteDialog();
                toast.error(<ErrorToast axiosError={error} defaultErrorMessage={i18next.t('wizard.entity.failedToDelete')} />);
            },
            onSuccess: () => {
                toast.success(i18next.t('wizard.entity.deletedSuccessfully'));
                closeDeleteDialog();
                navigate(`/category/${currentEntityTemplate?.category._id}`);
            },
        },
    );

    if (isEditMode) {
        return (
            <EditEntityDetails
                entityTemplate={entityTemplate}
                entity={expandedEntity.entity}
                onSuccessUpdate={(data) => {
                    setIsEditMode(false);
                    queryClient.setQueryData(['getExpandedEntity', entity.properties._id, { [entity.properties._id]: 1 }, { templateIds }], () => {
                        return {
                            ...expandedEntity,
                            entity: data,
                        };
                    });
                }}
                onCancelUpdate={() => setIsEditMode(false)}
                childTemplateId={childTemplateId}
            />
        );
    }

    return (
        <>
            <Card
                style={{
                    background: darkMode ? '#171717' : 'white',
                    opacity: isEntityDisabled ? '0.666' : '1',
                    borderRadius: '10px',
                    boxShadow: '-2px 2px 6px 0px #1e27754d',
                }}
            >
                <CardContent sx={{ '&:last-child': { padding: 0 } }}>
                    <Grid item container flexDirection="column" flexWrap="nowrap" padding="20px">
                        <Grid item>
                            <Grid container flexDirection="row" flexWrap="nowrap" justifyContent="flex-end" alignItems="center">
                                {includeLocationProperty && (
                                    <Grid onClick={() => setMapDialogOpen(true)}>
                                        <IconButtonWithPopover popoverText={i18next.t('map')}>
                                            <MapIcon sx={{ color: '#787c9e' }} />
                                        </IconButtonWithPopover>
                                    </Grid>
                                )}
                                <Grid
                                    onClick={() => {
                                        if (canWriteInstance && !isEntityDisabled) setIsEditMode(true);
                                    }}
                                >
                                    <IconButtonWithPopover
                                        popoverText={
                                            // eslint-disable-next-line no-nested-ternary
                                            !canWriteInstance
                                                ? i18next.t('permissions.dontHaveWritePermissionsToTemplate')
                                                : isEntityDisabled
                                                ? i18next.t('entityPage.disabledEntity')
                                                : i18next.t('actions.edit')
                                        }
                                        style={{
                                            cursor: !canWriteInstance || isEntityDisabled ? 'default' : 'pointer',
                                        }}
                                    >
                                        <ImageWithDisable srcPath="/icons/edit-icon.svg" disabled={!canWriteInstance || isEntityDisabled} />
                                    </IconButtonWithPopover>
                                </Grid>
                                <Grid
                                    onClick={() => {
                                        navigate(`/entity/${entity.properties._id}/graph`);
                                    }}
                                >
                                    <IconButtonWithPopover popoverText={i18next.t('actions.graph')}>
                                        <img src="/icons/graph-icon.svg" />
                                    </IconButtonWithPopover>
                                </Grid>
                                <IconButton onClick={handleClick}>
                                    <MoreVertOutlined sx={{ color: '#787c9e' }} />
                                </IconButton>
                                <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
                                    <TooltipMenuButton
                                        tooltipTitle={entityDetailTooltipTitle(canWriteInstance, isEntityDisabled)}
                                        onClick={() => {
                                            if (canWriteInstance && !isEntityDisabled) {
                                                navigate(
                                                    `/entity/${entity.properties._id}/duplicate${
                                                        childTemplateId ? `?childTemplateId=${childTemplateId}` : ''
                                                    }`,
                                                    {
                                                        state: { entityTemplate, expandedEntity, currentEntityTemplate },
                                                    },
                                                );
                                            }
                                            handleClose();
                                        }}
                                        disabled={!canWriteInstance || isEntityDisabled}
                                        icon={DuplicateIcon}
                                        text={i18next.t('actions.duplicate')}
                                    />

                                    <TooltipMenuButton
                                        tooltipTitle={entityDetailTooltipTitle(canWriteInstance, isEntityDisabled)}
                                        onClick={() => {
                                            setOpenDeleteDialog(true);
                                            handleClose();
                                        }}
                                        disabled={!canWriteInstance || entityTemplate.disabled || entity.properties.disabled}
                                        icon={DeleteIcon}
                                        text={i18next.t('actions.delete')}
                                    />

                                    <TooltipMenuButton
                                        tooltipTitle={entityDetailTooltipTitle(canWriteInstance, isEntityDisabled)}
                                        onClick={() => {
                                            if (canWriteInstance) {
                                                updateEntityStatus({ currEntity: entity, disabled: !entity.properties.disabled });
                                            }
                                            handleClose();
                                        }}
                                        disabled={!canWriteInstance || entityTemplate.disabled}
                                        icon={isEntityDisabled ? DoNotDisturbOffOutlinedIcon : DoNotDisturbOnOutlinedIcon}
                                        text={isEntityDisabled ? i18next.t('actions.activate') : i18next.t('actions.disable')}
                                    />
                                    <TooltipMenuButton
                                        tooltipTitle={i18next.t('permissions.dontHaveWritePermissionsToTemplate')}
                                        onClick={() => setDisplayArchiveProperties(!displayArchiveProperties)}
                                        disabled={!canWriteInstance}
                                        icon={displayArchiveProperties ? Archive : Unarchive}
                                        text={displayArchiveProperties ? i18next.t('entityPage.hideArchive') : i18next.t('entityPage.displayArchive')}
                                    />
                                </Menu>
                            </Grid>
                        </Grid>

                        <Grid item container justifyContent="space-between" alignItems="stretch" flexDirection="column" spacing={2}>
                            <Grid item width="100%">
                                <EntityProperties
                                    entityTemplate={entityTemplate}
                                    properties={entity.properties}
                                    style={{
                                        flexDirection: 'row',
                                        flexWrap: 'wrap',
                                        rowGap: '20px',
                                        columnGap: '20px',
                                        alignItems: 'center',
                                        width: '100%',
                                    }}
                                    innerStyle={{ width: '32%' }}
                                    textWrap
                                    mode="normal"
                                />
                                {displayArchiveProperties && (
                                    <EntityProperties
                                        entityTemplate={entityTemplate}
                                        properties={entity.properties}
                                        style={{
                                            flexDirection: 'row',
                                            flexWrap: 'wrap',
                                            rowGap: '20px',
                                            columnGap: '20px',
                                            alignItems: 'center',
                                            width: '100%',
                                        }}
                                        innerStyle={{ width: '32%' }}
                                        textWrap
                                        mode="normal"
                                        displayArchiveProperties
                                        showDivider
                                        dividerTitle={i18next.t('entityPage.archiveTitle')}
                                    />
                                )}
                            </Grid>

                            <Grid item>
                                <EntityDisableCheckbox isEntityDisabled={isEntityDisabled} />
                            </Grid>

                            {entityTemplate.documentTemplatesIds?.length ? (
                                <Grid item>
                                    <ExportFormats
                                        properties={expandedEntity.entity.properties}
                                        documentTemplateIds={entityTemplate.documentTemplatesIds}
                                        disabled={isEntityDisabled}
                                        justifyContent="flex-end"
                                        templateId={expandedEntity.entity.templateId}
                                    />
                                </Grid>
                            ) : null}

                            <Grid container item justifyContent="space-between">
                                <EntityDates
                                    createdAt={expandedEntity.entity.properties.createdAt}
                                    updatedAt={expandedEntity.entity.properties.updatedAt}
                                />
                            </Grid>
                        </Grid>
                    </Grid>
                </CardContent>

                <AreYouSureDialog
                    open={openDeleteDialog}
                    handleClose={closeDeleteDialog}
                    body={
                        expandedEntity.connections.length > 0 &&
                        workspaceAdmin &&
                        i18next.t('entityPage.wouldYouLikeToDeleteTheRelationshipsOfEntity')
                    }
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
            {mapDialogOpen && (
                <Dialog open={mapDialogOpen} onClose={() => setMapDialogOpen(false)}>
                    <LocationPreview entityProperties={entity.properties} entityTemplate={entityTemplate} />
                </Dialog>
            )}
        </>
    );
};

export { EntityDetails };
