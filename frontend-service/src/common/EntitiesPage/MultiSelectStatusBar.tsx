import { IServerSideSelectionState, IStatusPanelParams } from '@ag-grid-community/core';
import { Delete, Edit } from '@mui/icons-material';
import { Box, CircularProgress, Grid, Typography } from '@mui/material';
import { AxiosError } from 'axios';
import i18next from 'i18next';
import React, { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { IChildTemplatePopulated } from '../../interfaces/childTemplates';
import { IDeleteEntityBody, IMultipleSelect } from '../../interfaces/entities';
import { IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import { IBrokenRuleEntity, IFailedEntity } from '../../interfaces/excel';
import { ActionTypes, ICreateEntityMetadata } from '../../interfaces/ruleBreaches/actionMetadata';
import { IBrokenRule } from '../../interfaces/ruleBreaches/ruleBreach';
import ActionOnEntityWithRuleBreachDialog from '../../pages/Entity/components/ActionOnEntityWithRuleBreachDialog';
import { BackendConfigState } from '../../services/backendConfigService';
import { deleteEntityRequest, updateMultipleEntitiesRequest } from '../../services/entitiesService';
import { useDarkModeStore } from '../../stores/darkMode';
import { useUserStore } from '../../stores/user';
import { filterModelToFilterOfTemplate } from '../../utils/agGrid/agGridToSearchEntitiesOfTemplateRequest';
import { isWorkspaceAdmin } from '../../utils/permissions/instancePermissions';
import { filterFieldsFromPropertiesSchema, pickOnlyGivenFields } from '../../utils/pickFieldsPropertiesSchema';
import { isChildTemplate } from '../../utils/templates';
import { EntityWizardValues } from '../dialogs/entity';
import { getInitialValuesWithDefaults } from '../dialogs/entity/CreateOrEditEntityDialog';
import EditProps from '../dialogs/entity/CreateOrEditEntityDialog/EditProps';
import { EntityPropertiesInternal } from '../EntityProperties';
import { ErrorToast } from '../ErrorToast';
import { ajvValidate } from '../inputs/JSONSchemaFormik';
import { TableButton } from '../TableButton';
import { StepType, Wizard } from '../wizards';
import { StatusEntitiesTables } from '../wizards/excel/excelSteps/StatusEntitiesTables';
import { DeleteEntitiesDialog } from './DeleteEntitiesDialog';

interface MultiSelectStatusBarProps extends IStatusPanelParams {
    template: IMongoEntityTemplatePopulated | IChildTemplatePopulated;
    quickFilterText: string;
    setUpdatedTemplateIds?: React.Dispatch<React.SetStateAction<string[]>>;
}

export interface IUpdateMultipleEntitiesResponse {
    succeededEntities: ICreateEntityMetadata[];
    failedEntities: IFailedEntity[];
    brokenRulesEntities?: IBrokenRuleEntity[];
}

export const MultiSelectStatusBar: React.FC<MultiSelectStatusBarProps> = ({ api, template, quickFilterText, setUpdatedTemplateIds }) => {
    const initialValues: EntityWizardValues = getInitialValuesWithDefaults({
        template,
        attachmentsProperties: {},
        properties: { disabled: false },
    });

    const queryClient = useQueryClient();
    const darkMode = useDarkModeStore((state) => state.darkMode);
    const { deleteEntitiesLimit } = queryClient.getQueryData<BackendConfigState>('getBackendConfig')!;

    const parentTemplateId = isChildTemplate(template) ? template.parentTemplate._id : template._id;

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
    const [initialValuePropsToFilter, setInitialValuePropsToFilter] = useState<Record<string, any>>(initialValues);
    const [entityData, setEntityData] = useState<{ propertiesToChange: EntityWizardValues; propertiesToRemove: string[] } | undefined>(undefined);

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
                setUpdatedTemplateIds?.([parentTemplateId]);
            },
            onError: (error: AxiosError) => {
                if (error.response?.status === 413) {
                    toast.error(i18next.t('errorCodes.FILES_TOO_BIG'));
                    setExternalErrors((prev) => ({ ...prev, files: true }));
                } else toast.error(i18next.t('wizard.entity.loadEntities.failedLoadEntities'));
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
        const deleteBody: IDeleteEntityBody<boolean> = {
            ...getSelectedEntities(),
            deleteAllRelationships,
            templateId: parentTemplateId,
        };

        deleteMutation(deleteBody);
        setOpenDeleteDialog(false);
    };

    const handleClose = (renderData: boolean) => {
        setOpenEditDialog(false);
        setStepsData({ succeededEntities: [], failedEntities: [] });
        setSelectedFields({});
        setInitialValuePropsToFilter(initialValues);
        setWasDirty(false);
        setExternalErrors({ files: false, unique: {}, action: '' });
        setEntityData(undefined);
        setCreateOrUpdateWithRuleBreachDialogState(false);
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
                        wasDirty={wasDirty}
                        setWasDirty={setWasDirty}
                        externalErrors={externalErrors}
                        setExternalErrors={setExternalErrors}
                        isEditMode
                        showCloseButton={false}
                        initialValues={initialValues}
                        showTitle={false}
                    />
                );
            },
            validate: (values) => {
                const nonAttachmentsSchema = filterFieldsFromPropertiesSchema(values.template.properties, selectedFields);
                const filteredProperties = pickOnlyGivenFields(nonAttachmentsSchema, selectedFields);
                const propertiesErrors = ajvValidate({ ...nonAttachmentsSchema, properties: filteredProperties }, values.properties);

                if (Object.keys(propertiesErrors).length === 0) {
                    return {};
                }

                return { properties: propertiesErrors };
            },
            stepperActions: {
                next: {
                    disabled: !wasDirty && Object.values(selectedFields).every((value) => !value),
                },
            },
            invisibleBeforeStep: true,
        },
        {
            label: i18next.t('wizard.entity.multipleUpdate.summeryTitle'),
            component: (props) => {
                return (
                    <Box sx={{ width: '100%', paddingLeft: '4vw', paddingY: '2vh' }}>
                        <EntityPropertiesInternal
                            entityTemplate={template}
                            properties={{
                                ...props.values?.properties,
                                ...props.values?.attachmentsProperties,
                                createdAt: '',
                                updatedAt: '',
                                _id: '',
                            }}
                            coloredFields={{}}
                            mode="normal"
                            darkMode={darkMode}
                            overridePropertiesToShow={[
                                ...Object.keys(selectedFields ?? {}).filter((key) => selectedFields[key]),
                                ...Object.keys(props.values?.attachmentsProperties ?? {}),
                            ]}
                            textWrap
                            preview
                        />
                        <Box>
                            <Typography sx={{ marginY: '3vh', color: '#9398C2', fontSize: '16px' }}>
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
                    onClick: async (props) => {
                        const allSelectedProperties = { disabled: false };

                        Object.entries(selectedFields).forEach(([key, value]) => {
                            if (value) allSelectedProperties[key] = props.properties[key];
                        });

                        const undefinedProperties = Object.keys(allSelectedProperties).filter((property) => props.properties[property] === undefined);
                        setEntityData({
                            propertiesToChange: { ...props, properties: allSelectedProperties },
                            propertiesToRemove: undefinedProperties,
                        });

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
            component: (props) => {
                return (
                    <StatusEntitiesTables
                        {...props}
                        tablesData={{ ...stepsData, brokenRulesEntities: stepsData?.brokenRulesEntities?.map((rule) => rule.entities[0]) ?? [] }}
                        template={template}
                    />
                );
            },
            stepperActions: {
                hide: 'back',
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
                <Grid>
                    <TableButton
                        iconButtonWithPopoverProps={{
                            popoverText: i18next.t(`entitiesTableOfTemplate.deleteWithRelationship${workspaceAdmin ? 'Reference' : ''}Warn`),
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

                <Grid>
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
                    <Grid>
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
                handleClose={() => handleClose(false)}
                initialValues={initialValues}
                isEditMode
                title={`${i18next.t('wizard.entity.multipleUpdate.title')} - ${template.displayName}`}
                steps={steps}
                isLoading={isMultipleUpdateLoading}
                submitFunction={async () => (isBrokenRules ? setCreateOrUpdateWithRuleBreachDialogState(true) : handleClose(true))}
                direction="column"
                checkForChanges={false}
            />

            {createOrUpdateWithRuleBreachDialogState && isBrokenRules && (
                <ActionOnEntityWithRuleBreachDialog
                    isLoadingActionOnEntity={isMultipleUpdateLoading}
                    handleClose={() => handleClose(false)}
                    doActionEntity={async () => {
                        const entityWithIgnoreRules = {};
                        stepsData?.brokenRulesEntities?.forEach((rule) => {
                            const entityId = rule.entities?.[0]?.properties?._id;

                            if (entityId) {
                                if (entityWithIgnoreRules[entityId]) entityWithIgnoreRules[entityId].push(...rule.rawBrokenRules);
                                else entityWithIgnoreRules[entityId] = rule.rawBrokenRules;
                            }
                        });

                        if (entityData)
                            await updateMultipleMutation({
                                newEntityData: entityData.propertiesToChange,
                                entitiesToUpdate: {
                                    selectAll: false,
                                    idsToInclude: stepsData.brokenRulesEntities?.map((rule) => rule.entities[0].properties._id),
                                },
                                ignoredRules: entityWithIgnoreRules,
                                propertiesToRemove: entityData.propertiesToRemove,
                            });

                        handleClose(true);
                    }}
                    actionType={ActionTypes.UpdateMultipleEntities}
                    brokenRulesEntity={stepsData?.brokenRulesEntities ?? []}
                    onUpdatedRuleBlock={(brokenRules) => setStepsData((prevState) => ({ ...prevState, brokenRules }))}
                    entityFormData={{
                        template,
                        properties: { ...entityData?.propertiesToChange.properties, disabled: false },
                        attachmentsProperties: {},
                    }}
                    onCreateRuleBreachRequest={() => handleClose(true)}
                />
            )}
        </Grid>
    );
};
