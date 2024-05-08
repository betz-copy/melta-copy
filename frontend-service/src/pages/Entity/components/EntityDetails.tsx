import React, { useState } from 'react';
import { Grid, Card, CardContent, IconButton, Menu } from '@mui/material';
import {
    Delete as DeleteIcon,
    ContentCopy as DuplicateIcon,
    MoreVertOutlined,
    DoDisturbAlt,
    Edit as EditIcon,
    AccountTreeOutlined as GraphIcon,
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
import TooltipMenuButton from './TooltipMenuButton';
import { ImageWithDisable } from '../../../common/ImageWithDisable';
import IconButtonWithPopover from '../../../common/IconButtonWithPopover';
import { checkUserInstanceOfCategoryPermission } from '../../../utils/permissions/instancePermissions';

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
                    queryClient.setQueryData(['getExpandedEntity', entity.properties._id, { [entity.properties._id]: 1 }, { templateIds }], () => {
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

    const canWriteInstance = checkUserInstanceOfCategoryPermission(myPermissions.instancesPermissions, entityTemplate.category, 'Write');
    const isEntityDisabled = expandedEntity.entity.properties.disabled;
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
                            <Grid container flexDirection="row" flexWrap="nowrap" justifyContent="flex-end">
                                <Grid
                                    onClick={() => {
                                        if (canWriteInstance && !isEntityDisabled) setIsEditMode(true);
                                    }}
                                >
                                    <IconButtonWithPopover
                                        popoverText={
                                            // eslint-disable-next-line no-nested-ternary
                                            !canWriteInstance
                                                ? i18next.t('permissions.dontHaveWritePermissionsToCategory')
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

                                    <TooltipMenuButton
                                        tooltipTitle={
                                            // eslint-disable-next-line no-nested-ternary
                                            !canWriteInstance
                                                ? i18next.t('permissions.dontHaveWritePermissionsToCategory')
                                                : isEntityDisabled
                                                ? i18next.t('entityPage.disabledEntity')
                                                : ''
                                        }
                                        onClick={() => {
                                            if (!canWriteInstance || isEntityDisabled) return;
                                            setIsEditMode(true);
                                            handleClose();
                                        }}
                                        disabled={!canWriteInstance || isEntityDisabled}
                                        icon={EditIcon}
                                        text={i18next.t('actions.edit')}
                                    />

                                    <TooltipMenuButton
                                        tooltipTitle={!canWriteInstance ? i18next.t('permissions.dontHaveWritePermissionsToCategory') : ''}
                                        onClick={() => {
                                            if (canWriteInstance && !isEntityDisabled) {
                                                navigate(`/entity/${entity.properties._id}/duplicate`, {
                                                    state: { entityTemplate, expandedEntity, currentEntityTemplate },
                                                });
                                            }
                                            handleClose();
                                        }}
                                        disabled={!canWriteInstance}
                                        icon={DuplicateIcon}
                                        text={i18next.t('actions.duplicate')}
                                    />

                                    <TooltipMenuButton
                                        tooltipTitle={i18next.t('permissions.dontHaveWritePermissionsToCategory')}
                                        onClick={() => {
                                            setOpenDeleteDialog(true);
                                            handleClose();
                                        }}
                                        disabled={!canWriteInstance}
                                        icon={DeleteIcon}
                                        text={i18next.t('actions.delete')}
                                    />

                                    <TooltipMenuButton
                                        tooltipTitle={!canWriteInstance ? i18next.t('permissions.dontHaveWritePermissionsToCategory') : ''}
                                        onClick={() => {
                                            if (canWriteInstance) {
                                                updateEntityStatus({ currEntity: entity, disabled: !entity.properties.disabled });
                                            }
                                            handleClose();
                                        }}
                                        disabled={!canWriteInstance}
                                        icon={DoDisturbAlt}
                                        text={isEntityDisabled ? i18next.t('actions.activate') : i18next.t('actions.disable')}
                                    />
                                </Menu>
                            </Grid>
                        </Grid>

                        <Grid item container justifyContent="space-between" alignItems="stretch" padding="1rem" flexDirection="column">
                            <Grid item width="100%">
                                <EntityPropertiesInternal
                                    entityTemplate={entityTemplate}
                                    properties={entity.properties}
                                    darkMode={darkMode}
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
                            </Grid>
                            <Grid container marginTop="20px">
                                <EntityDisableCheckbox isEntityDisabled={isEntityDisabled}> </EntityDisableCheckbox>
                            </Grid>
                            <Grid marginTop="20px" container item justifyContent="space-between">
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
