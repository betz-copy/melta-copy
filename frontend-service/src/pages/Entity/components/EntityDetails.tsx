import { Card, CardContent, Grid } from '@mui/material';
import { AxiosError } from 'axios';
import i18next from 'i18next';
import React, { useState } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { useLocation } from 'wouter';
import { AreYouSureDialog } from '../../../common/dialogs/AreYouSureDialog';
import { ExportFormats } from '../../../common/dialogs/entity/ExportFormats';
import { EntityProperties } from '../../../common/EntityProperties';
import { ErrorToast } from '../../../common/ErrorToast';
import IconButtonWithPopover from '../../../common/IconButtonWithPopover';
import { ImageWithDisable } from '../../../common/ImageWithDisable';
import { IEntity, IEntityExpanded } from '../../../interfaces/entities';
import { IEntityTemplateMap, IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { PermissionScope } from '../../../interfaces/permissions';
import { IRuleBreach, IRuleBreachPopulated } from '../../../interfaces/ruleBreaches/ruleBreach';
import { deleteEntityRequest, updateEntityStatusRequest } from '../../../services/entitiesService';
import { useDarkModeStore } from '../../../stores/darkMode';
import { useUserStore } from '../../../stores/user';
import { checkUserCategoryPermission } from '../../../utils/permissions/instancePermissions';
import { EditEntityDetails } from './EditEntityDetails';
import { EntityDates } from './EntityDates';
import { EntityDisableCheckbox } from './EntityDisableCheckbox';
import UpdateStatusWithRuleBreachDialog from './UpdateStatusWithRuleBreachDialog';
import { CardMenu } from '../../SystemManagement/components/CardMenu';

const EntityDetails: React.FC<{ entityTemplate: IMongoEntityTemplatePopulated; expandedEntity: IEntityExpanded }> = ({
    entityTemplate,
    expandedEntity,
}) => {
    const { entity } = expandedEntity;
    const [_, navigate] = useLocation();
    const [isEditMode, setIsEditMode] = useState(false);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const queryClient = useQueryClient();

    const currentUser = useUserStore((state) => state.user);
    const darkMode = useDarkModeStore((state) => state.darkMode);

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

    const canWriteInstance = checkUserCategoryPermission(currentUser.currentWorkspacePermissions, entityTemplate.category, PermissionScope.write);
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
                            <Grid container flexDirection="row" flexWrap="nowrap" justifyContent="flex-end" alignItems="center">
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
                                <CardMenu
                                    onDuplicateClick={() => {
                                        if (canWriteInstance && !isEntityDisabled) {
                                            navigate(`/entity/${entity.properties._id}/duplicate`, {
                                                state: { entityTemplate, expandedEntity, currentEntityTemplate },
                                            });
                                        }
                                    }}
                                    onDeleteClick={() => {
                                        setOpenDeleteDialog(true);
                                    }}
                                    onDisableClick={() => {
                                        if (canWriteInstance) {
                                            updateEntityStatus({ currEntity: entity, disabled: !entity.properties.disabled });
                                        }
                                    }}
                                    disabledProps={{
                                        isDisabled: isEntityDisabled,
                                        canEdit: canWriteInstance,
                                        tooltipTitle: i18next.t('systemManagement.disabledEntity'),
                                    }}
                                />
                            </Grid>
                        </Grid>

                        <Grid item container justifyContent="space-between" alignItems="stretch" padding="1rem" flexDirection="column" spacing={2}>
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
