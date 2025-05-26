import { IServerSideSelectionState, IStatusPanelParams } from '@ag-grid-community/core';
import { Delete, Edit } from '@mui/icons-material';
import { Box, CircularProgress, Grid, Typography } from '@mui/material';
import { AxiosError } from 'axios';
import i18next from 'i18next';
import React, { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { IDeleteEntityBody, IEntity, IMultipleSelect } from '../../interfaces/entities';
import { IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import { BackendConfigState } from '../../services/backendConfigService';
import { deleteEntityRequest, updateMultipleEntitiesRequest } from '../../services/entitiesService';
import { useUserStore } from '../../stores/user';
import { filterModelToFilterOfTemplate } from '../../utils/agGrid/agGridToSearchEntitiesOfTemplateRequest';
import { isWorkspaceAdmin } from '../../utils/permissions/instancePermissions';
import { ErrorToast } from '../ErrorToast';
import { TableButton } from '../TableButton';
import { DeleteEntitiesDialog } from './DeleteEntitiesDialog';
import { LoadEntitiesTables } from '../wizards/excel/excelSteps/LoadEntitiesTables';
import { StepType, Wizard } from '../wizards';
import { EntityWizardValues } from '../dialogs/entity';
import EditProps from '../dialogs/entity/CreateOrEditEntityDialog/EditProps';
import ActionOnEntityWithRuleBreachDialog, { IBrokenRuleEntity } from '../../pages/Entity/components/ActionOnEntityWithRuleBreachDialog';
import { ActionTypes, ICreateEntityMetadata } from '../../interfaces/ruleBreaches/actionMetadata';
import { EntityPropertiesInternal } from '../EntityProperties';
import { useDarkModeStore } from '../../stores/darkMode';
import { ajvValidate } from '../inputs/JSONSchemaFormik';
import { filterFieldsFromPropertiesSchema } from '../../utils/pickFieldsPropertiesSchema';
import { IFailedEntity } from '../../interfaces/excel';
import { IBrokenRule } from '../../interfaces/ruleBreaches/ruleBreach';

interface MultiSelectStatusBarProps extends IStatusPanelParams {
    template: IMongoEntityTemplatePopulated;
    quickFilterText: string;
    setUpdatedTemplateIds?: React.Dispatch<React.SetStateAction<string[]>>;
}

export interface IUpdateMultipleEntitiesResponse {
    succeededEntities: ICreateEntityMetadata[];
    failedEntities: IFailedEntity[];
    brokenRulesEntities?: IBrokenRuleEntity[];
}

export const MultiSelectStatusBar: React.FC<MultiSelectStatusBarProps> = ({ api, template, quickFilterText, setUpdatedTemplateIds }) => {
    const initialValues: EntityWizardValues = {
        template,
        attachmentsProperties: {},
        properties: { disabled: false },
    };

    const queryClient = useQueryClient();
    const darkMode = useDarkModeStore((state) => state.darkMode);
    const { deleteEntitiesLimit } = queryClient.getQueryData<BackendConfigState>('getBackendConfig')!;

    const currentUser = useUserStore((state) => state.user);
    const workspaceAdmin = isWorkspaceAdmin(currentUser.currentWorkspacePermissions);

    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [openEditDialog, setOpenEditDialog] = useState(false);
    const [selectedRowCount, setSelectedRowCount] = useState(0);
    const [confirmDeleteDisplayNameValue, setConfirmDeleteDisplayNameValue] = useState('');

    const [externalErrors, setExternalErrors] = useState({ files: false, unique: {}, action: '' });
    const [createOrUpdateWithRuleBreachDialogState, setCreateOrUpdateWithRuleBreachDialogState] = useState(false);

    const [stepsData, setStepsData] = useState<IUpdateMultipleEntitiesResponse>({ succeededEntities: [], failedEntities: [] });
    const [selectedFields, setSelectedFields] = useState<Record<string, boolean>>({});
    const isBrokenRules = (stepsData.brokenRulesEntities ?? []).length > 0;
    const [wasDirty, setWasDirty] = useState(false);
    const [initialValuePropsToFilter, setInitialValuePropsToFilter] = useState<Record<string, any>>({});
    const [entityData, setEntityData] = useState<EntityWizardValues | undefined>(undefined);

    const { isLoading: isDeleteLoading, mutateAsync: deleteMutation } = useMutation(
        (deleteBody: IDeleteEntityBody) => deleteEntityRequest(deleteBody),
        {
            onError: (error: AxiosError) => {
                toast.error(<ErrorToast axiosError={error} defaultErrorMessage={i18next.t('wizard.entity.failedToDelete')} />);
            },
            onSuccess: () => {
                toast.success(i18next.t('wizard.entity.deletedEntitiesSuccess'));
                api.refreshServerSide();
            },
            onSettled: () => {
                api.deselectAll();
                setConfirmDeleteDisplayNameValue('');
            },
        },
    );

    const { isLoading: isMultipleUpdateLoading, mutateAsync: updateMultipleMutation } = useMutation(
        ({
            newEntityData,
            entitiesToUpdate,
            propertiesToRemove,
            ignoredRules,
        }: {
            newEntityData: EntityWizardValues;
            entitiesToUpdate: IMultipleSelect<boolean>;
            propertiesToRemove: string[];
            ignoredRules?: Record<string, IBrokenRule[]>;
        }) => updateMultipleEntitiesRequest(entitiesToUpdate, newEntityData, propertiesToRemove, ignoredRules),
        {
            onSuccess: (data) => {
                setStepsData(data);
            },
            onError: () => {
                toast.error(i18next.t('wizard.entity.loadEntities.failedLoadEntities'));
            },
        },
    );

    useEffect(() => {
        const updateSelectedRowCount = () => {
            const { selectAll, toggledNodes } = api.getServerSideSelectionState() as IServerSideSelectionState;

            if (selectAll) {
                const toggledNodesCount = toggledNodes.length;
                setSelectedRowCount(api.getDisplayedRowCount() - toggledNodesCount);
            } else setSelectedRowCount(api.getSelectedRows().length);
        };

        api.addEventListener('selectionChanged', updateSelectedRowCount);
        updateSelectedRowCount();

        return () => api.removeEventListener('selectionChanged', updateSelectedRowCount);
    }, [api]);

    const getSelectedEntities = () => {
        const { selectAll, toggledNodes } = api.getServerSideSelectionState() as IServerSideSelectionState;
        let selectedEntities: IMultipleSelect<boolean>;

        if (selectAll) {
            selectedEntities = {
                selectAll: true,
                idsToExclude: toggledNodes,
                filter: filterModelToFilterOfTemplate(api.getFilterModel(), template),
                textSearch: quickFilterText,
            };
        } else {
            const selectedRowsIds = api.getSelectedRows().map((row) => row.properties._id);
            selectedEntities = {
                selectAll: false,
                idsToInclude: selectedRowsIds,
            };
        }

        return selectedEntities;
    };

    const handleMultipleDelete = (deleteAllRelationships = false) => {
        const { _id: templateId } = template;
        const deleteBody: IDeleteEntityBody<boolean> = {
            ...getSelectedEntities(),
            deleteAllRelationships,
            templateId,
        };

        deleteMutation(deleteBody);
        setOpenDeleteDialog(false);
    };

    const handleClose = (renderData: boolean) => {
        setOpenEditDialog((prev) => !prev);
        setStepsData({ succeededEntities: [], failedEntities: [] });
        setSelectedFields({});
        setInitialValuePropsToFilter({});
        setWasDirty(false);
        setExternalErrors({ files: false, unique: {}, action: '' });
        if (renderData) {
            api.refreshServerSide();

            const relatedTemplateIds = Object.values(template.properties.properties)
                .filter((value) => value?.format === 'relationshipReference')
                .map((value) => value.relationshipReference?.relatedTemplateId!);

            setUpdatedTemplateIds?.(relatedTemplateIds);
        }
    };

    const steps: StepType<EntityWizardValues>[] = [
        {
            label: i18next.t('wizard.entity.multipleUpdate.editPropertiesTitle'),
            description: i18next.t('wizard.entity.multipleUpdate.editPropertiesDescription'),
            // eslint-disable-next-line react/no-unstable-nested-components
            component: (props) => {
                return (
                    <EditProps
                        setFieldValue={props.setFieldValue}
                        values={props.values}
                        errors={props.errors}
                        touched={props.touched}
                        setFieldTouched={props.setFieldTouched}
                        setInitialValuePropsToFilter={setInitialValuePropsToFilter}
                        initialValuePropsToFilter={initialValuePropsToFilter}
                        isMultipleSelection
                        multipleSelectionProps={{ selectedFields, setSelectedFields }}
                        entityTemplate={template}
                        draftId={undefined}
                        wasDirty={wasDirty}
                        setWasDirty={setWasDirty}
                        externalErrors={externalErrors}
                        setExternalErrors={setExternalErrors}
                        isEditMode
                        showCloseButton={false}
                        initialValues={initialValues}
                    />
                );
            },
            validate: (values) => {
                const nonAttachmentsSchema = filterFieldsFromPropertiesSchema(values.template.properties, selectedFields);
                const propertiesErrors = ajvValidate(nonAttachmentsSchema, values.properties);

                if (Object.keys(propertiesErrors).length === 0) {
                    return {};
                }

                return { properties: propertiesErrors };
            },

            stepperActions: {
                disable: 'back',
                next: {
                    onClick: (props, action) => {
                        const allSelectedProperties = {};
                        Object.entries(selectedFields).forEach(([key, value]) => {
                            if (value) allSelectedProperties[key] = undefined;
                        });
                        const newProperties = { ...allSelectedProperties, ...props.properties };
                        action.setValues({ ...props, properties: newProperties });
                    },
                },
            },
            invisibleBeforeStep: true,
        },
        {
            label: i18next.t('wizard.entity.multipleUpdate.summeryTitle'),
            // eslint-disable-next-line react/no-unstable-nested-components
            component: (props) => {
                return (
                    <Box sx={{ width: '100%', marginLeft: '4vw', marginY: '2vh' }}>
                        <EntityPropertiesInternal
                            entityTemplate={template}
                            properties={{ ...props.values?.properties, createdAt: '', updatedAt: '', _id: '' }}
                            mode="normal"
                            darkMode={darkMode}
                            overridePropertiesToShow={Object.keys(props.values?.properties || {})}
                            textWrap
                        />
                        <Box>
                            <Typography sx={{ marginY: '3vh', color: '#9398C2', fontSize: '18px' }}>
                                {`${i18next.t('wizard.entity.multipleUpdate.entitiesAmount')}:`}
                                <Typography component="span" variant="body2" sx={{ marginLeft: '10px', color: darkMode ? '#dcdde2' : '#53566E' }}>
                                    {selectedRowCount}
                                </Typography>
                            </Typography>
                        </Box>
                    </Box>
                );
            },
            stepperActions: {
                next: {
                    text: isBrokenRules ? i18next.t('wizard.entity.loadEntities.handleRules') : undefined,
                    onClick: async (props) => {
                        const undefinedProperties = Object.keys(props.properties).filter((property) => props.properties[property] === undefined);

                        await updateMultipleMutation({
                            newEntityData: props,
                            entitiesToUpdate: getSelectedEntities(),
                            propertiesToRemove: undefinedProperties,
                        });
                    },
                },
            },
            invisibleBeforeStep: true,
        },
        {
            label: i18next.t('wizard.entity.loadEntities.entitiesStatus'),
            // eslint-disable-next-line react/no-unstable-nested-components
            component: (props) => {
                return (
                    <LoadEntitiesTables
                        {...props}
                        tablesData={{ ...stepsData, brokenRulesEntities: stepsData?.brokenRulesEntities?.map((rule) => rule.entities[0]) ?? [] }}
                        template={template}
                    />
                );
            },
            stepperActions: {
                disable: 'back',
                next: {
                    text: isBrokenRules ? i18next.t('wizard.entity.loadEntities.handleRules') : undefined,
                },
            },
            invisibleBeforeStep: true,
        },
    ];

    return (
        <Grid>
            <Grid container spacing={2} alignItems="center">
                <Grid item>
                    <TableButton
                        iconButtonWithPopoverProps={{
                            popoverText: i18next.t(
                                workspaceAdmin
                                    ? 'entitiesTableOfTemplate.deleteWithRelationshipReferenceWarn'
                                    : 'entitiesTableOfTemplate.deleteWithRelationshipWarn',
                            ),
                            iconButtonProps: {
                                onClick: () => setOpenDeleteDialog(true),
                                sx: {
                                    fontSize: '15px',
                                    marginTop: '6px',
                                },
                            },
                        }}
                        icon={isDeleteLoading ? <CircularProgress /> : <Delete fontSize="small" />}
                        text={i18next.t('actions.delete')}
                        disableButton={selectedRowCount === 0 || selectedRowCount >= deleteEntitiesLimit}
                    />
                </Grid>

                <Grid item>
                    <TableButton
                        iconButtonWithPopoverProps={{
                            popoverText: i18next.t('actions.edit'),
                            iconButtonProps: {
                                onClick: () => setOpenEditDialog(true),
                                sx: {
                                    fontSize: '15px',
                                    marginTop: '6px',
                                },
                            },
                        }}
                        icon={isDeleteLoading ? <CircularProgress /> : <Edit fontSize="small" />}
                        text={i18next.t('actions.edit')}
                        disableButton={selectedRowCount === 0 || selectedRowCount >= deleteEntitiesLimit}
                    />
                </Grid>

                {selectedRowCount >= deleteEntitiesLimit && (
                    <Grid item>
                        <Typography color="error" variant="caption" fontSize="14px">
                            {i18next.t('entitiesTableOfTemplate.cantDeleteMoreThen', { limit: deleteEntitiesLimit })}
                        </Typography>
                    </Grid>
                )}
            </Grid>

            <DeleteEntitiesDialog
                open={openDeleteDialog}
                handleClose={() => {
                    setOpenDeleteDialog(false);
                    setConfirmDeleteDisplayNameValue('');
                }}
                onYes={() => handleMultipleDelete(workspaceAdmin)}
                isLoading={isDeleteLoading}
                entityTemplate={template}
                value={confirmDeleteDisplayNameValue}
                setValue={setConfirmDeleteDisplayNameValue}
            />

            <Wizard
                open={openEditDialog}
                handleClose={() => {
                    handleClose(false);
                }}
                initialValues={initialValues}
                isEditMode
                title={i18next.t('wizard.entity.multipleUpdate.title')}
                steps={steps}
                isLoading={isMultipleUpdateLoading}
                submitFunction={async (values) => {
                    if (isBrokenRules) {
                        setEntityData(values);
                        setCreateOrUpdateWithRuleBreachDialogState(true);
                    } else {
                        handleClose(true);
                    }
                }}
                direction="column"
            />

            {createOrUpdateWithRuleBreachDialogState && isBrokenRules && (
                <ActionOnEntityWithRuleBreachDialog
                    isLoadingActionOnEntity={isMultipleUpdateLoading}
                    handleClose={() => {
                        setCreateOrUpdateWithRuleBreachDialogState(false);
                    }}
                    doActionEntity={async () => {
                        const entityWithIgnoreRules = {};
                        stepsData?.brokenRulesEntities?.forEach((rule) => {
                            if (entityWithIgnoreRules[rule.entities[0].properties._id])
                                entityWithIgnoreRules[rule.entities[0].properties._id].push(...rule.rawBrokenRules);
                            else entityWithIgnoreRules[rule.entities[0].properties._id] = rule.rawBrokenRules;
                        });

                        if (entityData)
                            await updateMultipleMutation({
                                newEntityData: entityData,
                                entitiesToUpdate: {
                                    selectAll: false,
                                    idsToInclude: stepsData.brokenRulesEntities?.map((rule) => rule.entities[0].properties._id),
                                },
                                ignoredRules: entityWithIgnoreRules,
                                propertiesToRemove: [],
                            });

                        handleClose(true);
                    }}
                    actionType={ActionTypes.UpdateMultipleEntities}
                    brokenRulesEntity={stepsData?.brokenRulesEntities ?? []}
                    onUpdatedRuleBlock={(brokenRules) => {
                        setStepsData((prevState) => ({
                            ...prevState,
                            brokenRules,
                        }));
                    }}
                    entityFormData={{
                        template,
                        properties: { ...entityData?.properties, disabled: false },
                        attachmentsProperties: {},
                    }}
                    onCreateRuleBreachRequest={() => {
                        setCreateOrUpdateWithRuleBreachDialogState(false);
                        setOpenEditDialog(false);
                    }}
                />
            )}
        </Grid>
    );
};
