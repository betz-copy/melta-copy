/* eslint-disable react/no-unstable-nested-components */
import React, { useState } from 'react';
import i18next from 'i18next';
import { toast } from 'react-toastify';
import fileDownload from 'js-file-download';
import { useMutation } from 'react-query';
import { Grid } from '@mui/material';
import { StepType, Wizard, WizardBaseType } from '..';
import OpenPreview from '../../FilePreview/OpenPreview';
import { exportEntitiesRequest, loadEntitiesRequest } from '../../../services/entitiesService';
import { attachmentPropertiesBaseSchema } from '../entityTemplate/AddFields';
import { LoadEntitiesTables } from './loadEntitiesTables';
import { IBrokenRule, IBrokenRulePopulated } from '../../../interfaces/ruleBreaches/ruleBreach';
import { IEntitySingleProperty, IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { UploadExcel } from './uploadExcel';
import ActionOnEntityWithRuleBreachDialog from '../../../pages/Entity/components/ActionOnEntityWithRuleBreachDialog';
import { ActionErrors, ActionTypes, IAction, IActionMetadataPopulated, ICreateEntityMetadata } from '../../../interfaces/ruleBreaches/actionMetadata';
import { ICreateOrUpdateWithRuleBreachDialogState } from '../../dialogs/entity/CreateOrEditEntityDialog';
import { IRequiredConstraint, IUniqueConstraint } from '../../../interfaces/entities';

export interface EntitiesWizardValues {
    files?: File[];
    template?: IMongoEntityTemplatePopulated;
}

type IValidationError = { message: string; path: string; schemaPath: string; params: Partial<IEntitySingleProperty> };

export type IBrokenRuleEntity = {
    rawBrokenRules: IBrokenRule[];
    brokenRules: IBrokenRulePopulated[];
    actions: {
        actionType: ActionTypes;
        actionMetadata: IActionMetadataPopulated;
    }[];
    rawActions: IAction[];
    entities: { properties: Record<string, any> }[];
};

export interface ITablesResults {
    succeededEntities: ICreateEntityMetadata[];
    failedEntities: {
        properties: Record<string, any>;
        errors: { type: ActionErrors; metadata: IValidationError | IUniqueConstraint | IRequiredConstraint }[];
    }[];
    brokenRulesEntities?: IBrokenRuleEntity;
}

export enum StepStatus {
    initialSteps = 'initialSteps',
    stepsPreview = 'stepsPreview',
    stepsExpand = 'stepsExpand',
}
export interface ISteps {
    status: StepStatus;
    allEntities: ICreateEntityMetadata[];
    data: ITablesResults;
}

const LoadEntitiesWizard: React.FC<WizardBaseType<EntitiesWizardValues>> = ({
    open,
    handleClose,
    initialValues = { template: undefined, file: undefined },
    initialStep = 1,
    isEditMode = false,
}) => {
    const { template } = initialValues!;

    const [stepsData, setStepsData] = useState<ISteps>({
        status: StepStatus.initialSteps,
        allEntities: [],
        data: { succeededEntities: [], failedEntities: [] },
    });

    const isBrokenRules = stepsData.data.brokenRulesEntities && stepsData.data.brokenRulesEntities.brokenRules.length > 0;

    const [createOrUpdateWithRuleBreachDialogState, setCreateOrUpdateWithRuleBreachDialogState] = useState<ICreateOrUpdateWithRuleBreachDialogState>({
        isOpen: false,
    });

    const onClose = () => {
        handleClose();
        setStepsData({
            status: StepStatus.initialSteps,
            allEntities: [],
            data: { succeededEntities: [], failedEntities: [] },
        });
    };

    const { isLoading: isLoadingExcelEntities, mutateAsync: loadEntities } = useMutation(
        async (entities: ICreateEntityMetadata[]) => {
            return loadEntitiesRequest(entities, template!._id);
        },
        {
            onError() {
                toast.error(i18next.t('wizard.entity.loadEntities.failedLoadEntities'));
                setStepsData((prev) => ({ ...prev, status: StepStatus.stepsExpand }));
            },
            async onSuccess(data) {
                setStepsData((prev) => ({ ...prev, status: StepStatus.stepsExpand, data }));
                return data;
            },
        },
    );

    const { isLoading: isLoadingRules, mutateAsync: loadRules } = useMutation(
        async ({ entities, ignoredRules }: { entities: ICreateEntityMetadata[]; ignoredRules?: IBrokenRule[] }) => {
            return loadEntitiesRequest(entities, template!._id, ignoredRules);
        },
        {
            onError() {
                toast.error(i18next.t('wizard.entity.loadEntities.failedLoadEntities'));
                setStepsData((prev) => ({ ...prev, status: StepStatus.stepsExpand }));
            },
            async onSuccess(data) {
                setCreateOrUpdateWithRuleBreachDialogState({ isOpen: false });
                onClose();
                return data;
            },
        },
    );

    const { isLoading: isExportingTableToExcelFile, mutateAsync: exportTemplateToExcel } = useMutation(
        async ({ fileName, insertEntities }: { fileName: string; insertEntities?: { insert: boolean; entities?: Record<string, any>[] } }) => {
            return exportEntitiesRequest({
                fileName,
                templates: {
                    [template!._id]: { insertEntities, displayColumns: template?.propertiesOrder },
                },
            });
        },
        {
            onError() {
                toast.error(i18next.t('failedToExportTable'));
            },
            onSuccess(data) {
                fileDownload(data, `${template?.displayName}.xlsx`);
            },
        },
    );

    const submitFunction = async () => {
        if (isBrokenRules)
            setCreateOrUpdateWithRuleBreachDialogState({
                isOpen: true,
                rawBrokenRules: stepsData.data.brokenRulesEntities?.rawBrokenRules,
                brokenRules: stepsData.data.brokenRulesEntities?.brokenRules,
                actions: stepsData.data.brokenRulesEntities?.actions,
                rawActions: stepsData.data.brokenRulesEntities?.rawActions,
            });
        else {
            onClose();
            toast.success(i18next.t('wizard.entity.loadEntities.createdSuccessfully'));
        }
    };

    const steps: StepType<EntitiesWizardValues>[] = [
        {
            label: i18next.t('wizard.entity.loadEntities.downloadFileTitle'),
            description: i18next.t('wizard.entity.loadEntities.downloadFileDescription'),
            component: () => (
                <OpenPreview
                    fileId={`${i18next.t('entitiesTableOfTemplate.downloadOneTableTitle')}.xlsx`}
                    onClick={() =>
                        exportTemplateToExcel({
                            fileName: `${template?.displayName}.xlsx`,
                            insertEntities: {
                                insert: true,
                            },
                        })
                    }
                    loading={isExportingTableToExcelFile}
                    type="exportTable"
                    showText
                />
            ),
            validationSchema: {},
            stepperActions: { disable: 'all' },
        },
        {
            label: i18next.t('wizard.entity.loadEntities.uploadFilesTitle'),
            component: (props) => (
                <UploadExcel
                    formikProps={props}
                    template={template!}
                    stepsData={stepsData}
                    setStepsData={setStepsData}
                    isLoading={isExportingTableToExcelFile}
                    onDownload={() =>
                        exportTemplateToExcel({
                            fileName: `${template?.displayName}.xlsx`,
                            insertEntities: {
                                insert: true,
                                entities: stepsData.allEntities.map((entity) => entity.properties),
                            },
                        })
                    }
                />
            ),
            validationSchema: stepsData.status === StepStatus.initialSteps ? attachmentPropertiesBaseSchema : {},
            stepperActions: {
                disable: stepsData.status === StepStatus.initialSteps ? 'all' : undefined,
                back: {
                    onClick: () => {
                        if (stepsData.status === StepStatus.stepsPreview) {
                            setStepsData({
                                status: StepStatus.initialSteps,
                                allEntities: [],
                                data: { succeededEntities: [], failedEntities: [] },
                            });
                        }
                    },
                },
                next: {
                    text: i18next.t('wizard.entity.loadEntities.loadEntities'),
                    onClick: async () => {
                        if (stepsData.status === StepStatus.stepsPreview) {
                            const data = await loadEntities(stepsData.allEntities);
                            if (data.failedEntities.length > 0)
                                await exportTemplateToExcel({
                                    fileName: `${template?.displayName}: ${i18next.t('wizard.entity.loadEntities.failedEntities')}.xlsx`,
                                    insertEntities: {
                                        insert: true,
                                        entities: data.failedEntities.map((entity) => entity.properties),
                                    },
                                });
                        }
                    },
                },
            },
        },
        {
            label: i18next.t('wizard.entity.loadEntities.entitiesStatus'),
            component: (props) => {
                return (
                    <LoadEntitiesTables
                        {...props}
                        tablesData={stepsData.data}
                        template={template!}
                        onDownload={(brokenRulesEntities?: boolean) => {
                            return exportTemplateToExcel({
                                fileName: `${template?.displayName}: ${i18next.t(
                                    `wizard.entity.loadEntities.${brokenRulesEntities ? 'brokenRules' : 'failed'}`,
                                )}.xlsx`,
                                insertEntities: {
                                    insert: true,
                                    entities: brokenRulesEntities
                                        ? stepsData.data.brokenRulesEntities?.entities.map((entity) => entity.properties)
                                        : stepsData.data.failedEntities.map((entity) => entity.properties),
                                },
                            });
                        }}
                        isLoadingDownload={isExportingTableToExcelFile}
                        isLoadingTables={isLoadingExcelEntities}
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
            <Wizard
                open={open}
                handleClose={onClose}
                initialValues={initialValues}
                initialStep={initialStep}
                isEditMode={isEditMode}
                title={i18next.t('wizard.entity.loadEntities.title')}
                steps={steps}
                isLoading={isLoadingExcelEntities}
                submitFunction={submitFunction}
                direction="column"
                showPrevSteps
            />
            {createOrUpdateWithRuleBreachDialogState.isOpen && isBrokenRules && (
                <ActionOnEntityWithRuleBreachDialog
                    isLoadingActionOnEntity={isLoadingRules}
                    handleClose={() => {
                        setCreateOrUpdateWithRuleBreachDialogState({ isOpen: false });
                        setStepsData({
                            status: StepStatus.initialSteps,
                            allEntities: [],
                            data: { succeededEntities: [], failedEntities: [] },
                        });
                    }}
                    doActionEntity={() => {
                        const brokenRulesEntities =
                            stepsData.data.brokenRulesEntities?.entities.map(({ properties }) => ({
                                templateId: template!._id,
                                properties,
                            })) || [];

                        return loadRules({
                            entities: brokenRulesEntities,
                            ignoredRules: stepsData.data.brokenRulesEntities?.rawBrokenRules,
                        });
                    }}
                    actionType={ActionTypes.CreateEntity}
                    brokenRules={createOrUpdateWithRuleBreachDialogState.brokenRules!}
                    rawBrokenRules={createOrUpdateWithRuleBreachDialogState.rawBrokenRules!}
                    onUpdatedRuleBlock={(brokenRules) =>
                        setCreateOrUpdateWithRuleBreachDialogState((prevState) => ({
                            ...prevState,
                            brokenRules,
                        }))
                    }
                    entityFormData={{
                        template: template!,
                        properties: { ...stepsData.data.brokenRulesEntities?.entities[0].properties, disabled: false },
                        attachmentsProperties: {},
                    }}
                    onCreateRuleBreachRequest={() => {
                        setCreateOrUpdateWithRuleBreachDialogState({ isOpen: false });
                        onClose();
                    }}
                    actions={createOrUpdateWithRuleBreachDialogState.actions}
                    rawActions={createOrUpdateWithRuleBreachDialogState.rawActions}
                    loadEntities
                />
            )}
        </Grid>
    );
};

export { LoadEntitiesWizard };
