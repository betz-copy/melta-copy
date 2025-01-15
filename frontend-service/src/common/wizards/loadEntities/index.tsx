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
import { environment } from '../../../globals';

export interface EntitiesWizardValues {
    files?: File[];
    template?: IMongoEntityTemplatePopulated;
}

export type IValidationError = {
    message: string;
    path: string;
    schemaPath: string;
    params: Partial<IEntitySingleProperty> & { allowedValues?: string[] };
};

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

export interface IError {
    type: ActionErrors;
    metadata: IValidationError | IUniqueConstraint | IRequiredConstraint;
}

export interface IFailedEntity {
    properties: Record<string, any>;
    errors: IError[];
}

export interface ITablesResults {
    succeededEntities: ICreateEntityMetadata[];
    failedEntities: IFailedEntity[];
    brokenRulesEntities?: IBrokenRuleEntity;
}

export enum StepStatus {
    uploadExcel = 'uploadExcel',
    previewExcelRows = 'previewExcelRows',
    excelUploadResult = 'excelUploadResult',
}
export interface ISteps {
    status: StepStatus;
    files?: Record<string, File>;
    data: ITablesResults;
}

const { excelExtension } = environment.loadExcel;

const LoadEntitiesWizard: React.FC<WizardBaseType<EntitiesWizardValues>> = ({
    open,
    handleClose,
    initialValues = { template: undefined, file: undefined },
    initialStep = 1,
    isEditMode = false,
}) => {
    const { template } = initialValues!;

    const [stepsData, setStepsData] = useState<ISteps>({
        status: StepStatus.uploadExcel,
        data: { succeededEntities: [], failedEntities: [] },
    });

    const isBrokenRules = (stepsData.data.brokenRulesEntities?.brokenRules ?? []).length > 0;
    const [createOrUpdateWithRuleBreachDialogState, setCreateOrUpdateWithRuleBreachDialogState] = useState<ICreateOrUpdateWithRuleBreachDialogState>({
        isOpen: false,
    });

    const onClose = () => {
        handleClose();
        setStepsData({
            status: StepStatus.uploadExcel,
            data: { succeededEntities: [], failedEntities: [] },
        });
    };

    const { isLoading: isLoadingExcelEntities, mutateAsync: loadEntities } = useMutation(
        async (files: Record<string, File>) => {
            return loadEntitiesRequest(template!._id, files);
        },
        {
            async onSuccess(data) {
                setStepsData((prev) => ({ ...prev, data }));
                return data;
            },
            onError() {
                toast.error(i18next.t('wizard.entity.loadEntities.failedLoadEntities'));
            },
        },
    );

    const { isLoading: isLoadingRules, mutateAsync: loadRules } = useMutation(
        async (insertBrokenEntities: { entitiesToCreate: ICreateEntityMetadata[]; ignoredRules: IBrokenRule[] }) => {
            return loadEntitiesRequest(template!._id, undefined, insertBrokenEntities);
        },
        {
            async onSuccess(data) {
                setCreateOrUpdateWithRuleBreachDialogState({ isOpen: false });
                onClose();
                return data;
            },
            onError() {
                toast.error(i18next.t('wizard.entity.loadEntities.failedLoadEntities'));
            },
        },
    );

    const { isLoading: isExportingTableToExcelFile, mutateAsync: exportTemplateToExcel } = useMutation(
        async ({ fileName, headersOnly, insertEntities }: { fileName: string; headersOnly?: boolean; insertEntities?: Record<string, any>[] }) => {
            return exportEntitiesRequest({
                fileName,
                templates: {
                    [template!._id]: { headersOnly, insertEntities, displayColumns: template?.propertiesOrder },
                },
            });
        },
        {
            onSuccess(data) {
                fileDownload(data, `${template?.displayName}${excelExtension}`);
            },
            onError() {
                toast.error(i18next.t('failedToExportTable'));
            },
        },
    );

    const submitFunction = async () => {
        if (isBrokenRules)
            setCreateOrUpdateWithRuleBreachDialogState({
                isOpen: true,
                ...(stepsData.data.brokenRulesEntities ?? {}),
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
                    fileId={{ name: `${i18next.t('entitiesTableOfTemplate.downloadOneTableTitle')}${excelExtension}` } as File}
                    onClick={() =>
                        exportTemplateToExcel({
                            fileName: `${template?.displayName}${excelExtension}`,
                            headersOnly: true,
                        })
                    }
                    download
                    showText
                />
            ),
            validationSchema: {},
            stepperActions: { disable: 'all' },
        },
        {
            label: i18next.t('wizard.entity.loadEntities.uploadFilesTitle'),
            component: (props) => (
                <UploadExcel formikProps={props} template={template!} stepsData={stepsData} setStepsData={setStepsData} onDownload={async () => {}} />
            ),
            validationSchema: stepsData.status === StepStatus.uploadExcel ? attachmentPropertiesBaseSchema : {},
            stepperActions: {
                disable: stepsData.status === StepStatus.uploadExcel ? 'all' : undefined,
                back: {
                    onClick: () => {
                        if (stepsData.status === StepStatus.previewExcelRows) {
                            setStepsData({
                                status: StepStatus.uploadExcel,
                                data: { succeededEntities: [], failedEntities: [] },
                            });
                        }
                    },
                },
                next: {
                    text: i18next.t('wizard.entity.loadEntities.loadEntities'),
                    onClick: async () => {
                        if (stepsData.status === StepStatus.previewExcelRows) {
                            setStepsData((prev) => ({ ...prev, status: StepStatus.excelUploadResult }));
                            const data = await loadEntities(stepsData.files!);
                            const hasFailedEntities = data.failedEntities.length > 0;
                            const hasBrokenRulesEntities = !!data.brokenRulesEntities?.entities?.length;

                            if (hasFailedEntities || hasBrokenRulesEntities) {
                                await exportTemplateToExcel({
                                    fileName: `${template?.displayName}: ${i18next.t('wizard.entity.loadEntities.failedEntities')}${excelExtension}`,
                                    insertEntities: [
                                        ...data.failedEntities.map((entity) => entity.properties),
                                        ...(data.brokenRulesEntities?.entities?.map((entity) => entity.properties) || []),
                                    ],
                                });
                            }
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
                                )}${excelExtension}`,
                                insertEntities: brokenRulesEntities
                                    ? stepsData.data.brokenRulesEntities?.entities.map((entity) => entity.properties)
                                    : stepsData.data.failedEntities.map((entity) => entity.properties),
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
                title={`${i18next.t('wizard.entity.loadEntities.title')} - ${template?.displayName}`}
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
                            status: StepStatus.uploadExcel,
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
                            entitiesToCreate: brokenRulesEntities,
                            ignoredRules: stepsData.data.brokenRulesEntities?.rawBrokenRules || [],
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
