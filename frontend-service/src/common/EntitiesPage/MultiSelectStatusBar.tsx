import { IServerSideSelectionState, IStatusPanelParams } from '@ag-grid-community/core';
import { Delete, Edit } from '@mui/icons-material';
import { CircularProgress, Dialog, Grid, Typography } from '@mui/material';
import { AxiosError } from 'axios';
import i18next from 'i18next';
import React, { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { IDeleteEntityBody, IEntity, IEntityWithIgnoredRules, IMultipleSelect } from '../../interfaces/entities';
import { IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import { BackendConfigState } from '../../services/backendConfigService';
import { deleteEntityRequest, editManyEntitiesByExcelRequest, updateMultipleEntitiesRequest } from '../../services/entitiesService';
import { useUserStore } from '../../stores/user';
import { filterModelToFilterOfTemplate } from '../../utils/agGrid/agGridToSearchEntitiesOfTemplateRequest';
import { isWorkspaceAdmin } from '../../utils/permissions/instancePermissions';
import { ErrorToast } from '../ErrorToast';
import { TableButton } from '../TableButton';
import { DeleteEntitiesDialog } from './DeleteEntitiesDialog';
import { CreateOrEditEntityDetails } from '../dialogs/entity/CreateOrEditEntityDialog';
import { LoadEntitiesTables } from '../wizards/excel/excelSteps/LoadEntitiesTables';
import { StepType, Wizard } from '../wizards';
import { EntitiesWizardValues, ITablesResults } from '../../interfaces/excel';
import { MutationActionType, ICreateOrUpdateWithRuleBreachDialogState } from '../../interfaces/CreateOrEditEntityDialog';
import { EntityWizardValues } from '../dialogs/entity';
import { IRuleBreach } from '../../interfaces/ruleBreaches/ruleBreach';
import EditProps from '../dialogs/entity/CreateOrEditEntityDialog/EditProps';
import ActionOnEntityWithRuleBreachDialog from '../../pages/Entity/components/ActionOnEntityWithRuleBreachDialog';
import { ActionTypes } from '../../interfaces/ruleBreaches/actionMetadata';
import { groupBrokenRulesByEntity } from '../../utils/loadEntities';

interface MultiSelectStatusBarProps extends IStatusPanelParams {
    template: IMongoEntityTemplatePopulated;
    quickFilterText: string;
}

export const MultiSelectStatusBar: React.FC<MultiSelectStatusBarProps> = ({ api, template, quickFilterText }) => {
    const queryClient = useQueryClient();
    const { deleteEntitiesLimit } = queryClient.getQueryData<BackendConfigState>('getBackendConfig')!;

    const currentUser = useUserStore((state) => state.user);
    const workspaceAdmin = isWorkspaceAdmin(currentUser.currentWorkspacePermissions);

    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [openEditDialog, setOpenEditDialog] = useState(false);
    const [selectedRowCount, setSelectedRowCount] = useState(0);
    const [confirmDeleteDisplayNameValue, setConfirmDeleteDisplayNameValue] = useState('');

    const [externalErrors, setExternalErrors] = useState({ files: false, unique: {}, action: '' });
    const [createOrUpdateWithRuleBreachDialogState, setCreateOrUpdateWithRuleBreachDialogState] = useState(false);

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

    const initialValues: any = {
        template,
        attachmentsProperties: {},
        properties: {},
    };

    const [stepsData, setStepsData] = useState<any>({ succeededEntities: [], failedEntities: [] });

    const isBrokenRules = (stepsData.brokenRulesEntities?.brokenRules ?? []).length > 0;

    const { isLoading: isMultipleUpdateLoading, mutateAsync: updateMultipleMutation } = useMutation(
        ({
            newEntityData,
            entitiesToUpdate,
            ignoredRules,
        }: {
            newEntityData: EntityWizardValues;
            entitiesToUpdate: IMultipleSelect<boolean>;
            ignoredRules?: IRuleBreach['brokenRules'];
        }) => updateMultipleEntitiesRequest(entitiesToUpdate, newEntityData, ignoredRules),
        {
            onSuccess: (data) => {
                setStepsData(data);
            },
            onError: (err: AxiosError, { newEntityData }) => {
                toast.error(i18next.t('wizard.entity.loadEntities.failedLoadEntities'));
            },
        },
    );

    const [wasDirty, setWasDirty] = useState(false);
    const [initialValuePropsToFilter, setInitialValuePropsToFilter] = useState<object>({});

    const steps: StepType<EntitiesWizardValues>[] = [
        {
            label: i18next.t('wizard.entity.loadEntities.downloadFileTitle'), // TODO CHANGE THE LABEL
            description: i18next.t('wizard.entity.loadEntities.downloadFileDescription'), // TODO CHANGE THE DESCRIPTION
            // eslint-disable-next-line react/no-unstable-nested-components
            component: (props) => {
                return (
                    // <CreateOrEditEntityDetails
                    //     mutationProps={{
                    //         actionType: MutationActionType.UpdateMultiple,
                    //         payload: getSelectedEntities(),
                    //     }}
                    //     initialCurrValues={props?.values?.valuesToUpdate}
                    //     entityTemplate={template}
                    //     // onSuccess={(prop) => {
                    //     //     // console.log('im in first step', prop);
                    //     //     setStepsData(prop);
                    //     //     // setStepsData({ succeededEntities: [], failedEntities: [] });

                    //     //     // setOpenEditDialog((prev) => !prev);
                    //     //     // setExternalErrors({ files: false, unique: {}, action: '' });
                    //     //     // api.refreshServerSide();
                    //     //     // setCurrentStep(1);
                    //     // }}
                    //     handleClose={() => {
                    //         // setOpenEditDialog((prev) => !prev);
                    //     }}
                    //     // onError={() => {
                    //     //     setOpenEditDialog(true);
                    //     // }}
                    //     externalErrors={externalErrors}
                    //     setExternalErrors={setExternalErrors}
                    //     createOrUpdateWithRuleBreachDialogState={createOrUpdateWithRuleBreachDialogState}
                    //     setCreateOrUpdateWithRuleBreachDialogState={setCreateOrUpdateWithRuleBreachDialogState}
                    //     createDraft={false}
                    //     showActionButtons={false}
                    //     submitHandler={(data) => {
                    //         // updateMultipleMutation(data);
                    //         console.log({ data, selectedRowCount });

                    //         setStepsData({ data: { ...data, sum: selectedRowCount } });
                    //         props.setFieldValue('valuesToUpdate', data);
                    //         setCurrentStep(1);
                    //     }}
                    // />
                    <EditProps
                        setFieldValue={props.setFieldValue}
                        values={props.values}
                        errors={props.errors}
                        touched={props.touched}
                        setFieldTouched={props.setFieldTouched}
                        setValues={props.setValues}
                        setInitialValuePropsToFilter={setInitialValuePropsToFilter}
                        initialValuePropsToFilter={initialValuePropsToFilter}
                        isMultipleSelection
                        entityTemplate={template}
                        draftId={undefined}
                        wasDirty={wasDirty}
                        setWasDirty={setWasDirty}
                        externalErrors={externalErrors}
                        setExternalErrors={setExternalErrors}
                        isEditMode
                        currentDraft={undefined}
                        showActionButtons={false}
                        setIsDraftDialogOpen={undefined}
                        handleClose={undefined}
                        initialValues={initialValues}
                    />
                );
            },
            validationSchema: {},
            stepperActions: {
                disable: 'back',
            },
            invisibleBeforeStep: true,
        },
        {
            label: i18next.t('wizard.entity.loadEntities.entitiesStatus'),
            // eslint-disable-next-line react/no-unstable-nested-components
            component: (props) => {
                return (
                    <div>
                        {Object.entries(props.values?.properties || {}).map(([A, b]) => (
                            <div>{`${A} : ${b}`}</div>
                        ))}
                        <div>{selectedRowCount}</div>
                    </div>
                );
            },
            stepperActions: {
                next: {
                    text: isBrokenRules ? i18next.t('wizard.entity.loadEntities.handleRules') : undefined,
                    onClick: async (props) => {
                        // await stepsData.data.mutateAsync(stepsData.data.values);
                        await updateMultipleMutation({ newEntityData: props, entitiesToUpdate: getSelectedEntities() });

                        // setStepsData({ succeededEntities: [], failedEntities: [] });
                        // setCurrentStep(2);
                    },
                },
            },
            invisibleBeforeStep: true,
        },
        {
            label: i18next.t('wizard.entity.loadEntities.entitiesStatus'),
            // eslint-disable-next-line react/no-unstable-nested-components
            component: (props) => {
                console.log({ stepsData });

                return <LoadEntitiesTables {...props} tablesData={stepsData} template={template} />;
            },
            stepperActions: {
                // TODO add disabled on back
                next: {
                    text: isBrokenRules ? i18next.t('wizard.entity.loadEntities.handleRules') : undefined,
                },
            },
            invisibleBeforeStep: true,
        },
    ];

    const [data, setData] = useState({});

    return (
        <Grid>
            <Grid container spacing={2} alignItems="center">
                <Grid item>
                    <TableButton
                        iconButtonWithPopoverProps={{
                            popoverText: i18next.t('actions.delete'),
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

                <Grid item>
                    <Typography sx={{ color: 'warning.main' }} variant="caption" fontSize="14px">
                        {i18next.t(
                            workspaceAdmin
                                ? 'entitiesTableOfTemplate.deleteWithRelationshipReferenceWarn'
                                : 'entitiesTableOfTemplate.deleteWithRelationshipWarn',
                        )}
                    </Typography>
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
                    setOpenEditDialog((prev) => !prev);
                }}
                initialValues={initialValues}
                isEditMode
                title={`${i18next.t('wizard.entity.loadEntities.title')} - ${template?.displayName}`}
                steps={steps}
                isLoading={isMultipleUpdateLoading}
                submitFunction={async (values) => {
                    if (isBrokenRules) {
                        setData(values);
                        setCreateOrUpdateWithRuleBreachDialogState(true);
                    } else {
                        setOpenEditDialog((prev) => !prev);
                        setExternalErrors({ files: false, unique: {}, action: '' });
                        api.refreshServerSide();
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
                        await updateMultipleMutation({
                            newEntityData: data,
                            entitiesToUpdate: {
                                selectAll: false,
                                idsToInclude: stepsData.brokenRulesEntities?.entities.map(({ properties }) => properties._id),
                            },
                            ignoredRules: stepsData?.brokenRulesEntities.rawBrokenRules || [],
                        });

                        setOpenEditDialog(false);
                        setExternalErrors({ files: false, unique: {}, action: '' });
                        api.refreshServerSide();
                    }}
                    actionType={ActionTypes.UpdateMultipleEntities} // change to update
                    brokenRules={stepsData?.brokenRulesEntities.brokenRules || []}
                    rawBrokenRules={stepsData?.brokenRulesEntities.rawBrokenRules || []}
                    onUpdatedRuleBlock={(brokenRules) => {
                        setStepsData((prevState) => ({
                            ...prevState,
                            brokenRules,
                        }));
                    }}
                    entityFormData={{
                        template,
                        properties: { ...data.properties, disabled: false },
                        attachmentsProperties: {},
                    }}
                    onCreateRuleBreachRequest={() => {
                        setCreateOrUpdateWithRuleBreachDialogState(false);
                        setOpenEditDialog(false);
                    }}
                    actions={stepsData.brokenRulesEntities?.actions}
                    rawActions={stepsData.brokenRulesEntities?.rawActions}
                    entities={stepsData?.brokenRulesEntities?.entities || []}
                />
            )}
        </Grid>
    );
};
