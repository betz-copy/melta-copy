/* eslint-disable react/no-unstable-nested-components */
import React, { useState } from 'react';
import i18next from 'i18next';
import { toast } from 'react-toastify';
import fileDownload from 'js-file-download';
import { useMutation } from 'react-query';
import { Grid } from '@mui/material';
import { AxiosError } from 'axios';
import { StepsType, Wizard, WizardBaseType } from '..';
import OpenPreview from '../../FilePreview/OpenPreview';
import { exportEntitiesRequest, runBulkOfActionsRequest } from '../../../services/entitiesService';
import { attachmentPropertiesBaseSchema } from '../entityTemplate/AddFields';
import { LoadEntitiesTables } from './loadEntitiesTables';
import { IBrokenRule, IBrokenRulePopulated } from '../../../interfaces/ruleBreaches/ruleBreach';
import { IEntitySingleProperty } from '../../../interfaces/entityTemplates';
import { UploadExcel } from './uploadExcel';
import ActionOnEntityWithRuleBreachDialog from '../../../pages/Entity/components/ActionOnEntityWithRuleBreachDialog';
import { ActionTypes, IAction } from '../../../interfaces/ruleBreaches/actionMetadata';
import { ICreateOrUpdateWithRuleBreachDialogState } from '../../dialogs/entity/CreateOrEditEntityDialog';
import { IRequiredConstraint, IUniqueConstraint } from '../../../interfaces/entities';

export interface EntitiesWizardValues {
    file?: File;
}
type IValidationError = { message: string; path: string; schemaPath: string; params: Partial<IEntitySingleProperty> };
export interface ITablesResults {
    succeededEntities: { templateId: string; properties: Record<string, any> }[];
    failedEntities: {
        properties: Record<string, any>;
        errors: { type: 'VALIDATION' | 'UNIQUE' | 'REQUIRED'; metadata: IValidationError | IUniqueConstraint | IRequiredConstraint }[];
    }[];
    brokenRulesEntities?: { rawBrokenRules: IBrokenRule[]; brokenRules: IBrokenRulePopulated[]; entities: { properties: Record<string, any> }[] };
}

interface ITablesData extends ITablesResults {
    allEntities: { properties: Record<string, any> }[];
}

export interface ISteps {
    status: 'initialSteps' | 'stepsPreview' | 'stepsExpand';
    data: ITablesData;
}

interface InsertEntities {
    insert: boolean;
    entities?: Record<string, any>[];
}

export interface ExportRequestParams {
    fileName: string;
    insertEntities?: InsertEntities;
}

const LoadEntitiesWizard: React.FC<WizardBaseType<EntitiesWizardValues>> = ({
    open,
    handleClose,
    initialValues = { file: undefined },
    isEditMode = false,
    template,
}) => {
    const [stepsData, setStepsData] = useState<ISteps>({
        status: 'initialSteps',
        data: { allEntities: [], succeededEntities: [], failedEntities: [] },
    });

    const [createOrUpdateWithRuleBreachDialogState, setCreateOrUpdateWithRuleBreachDialogState] = useState<ICreateOrUpdateWithRuleBreachDialogState>({
        isOpen: false,
    });

    const { isLoading: isCreateBulkLoading, mutateAsync: createBulkMutation } = useMutation(
        ({ actionsGroups, ignoredRules }: { actionsGroups: IAction[][]; ignoredRules?: IBrokenRule[] }) =>
            runBulkOfActionsRequest(actionsGroups, ignoredRules, false),
        {
            onSuccess: (data) => {
                console.log('not dry', { data });
                // handleClose();
                // setCreateOrUpdateWithRuleBreachDialogState({ isOpen: false });
            },
            onError: (err: AxiosError) => {
                console.log({ err });
                toast.error(i18next.t('wizard.entity.loadEntities.failedUploadEntities'));
            },
        },
    );

    const { isLoading: isExportingTableToExcelFile, mutateAsync: exportTemplateToExcel } = useMutation<any, unknown, ExportRequestParams>(
        async ({ fileName, insertEntities }) => {
            return exportEntitiesRequest({
                fileName,
                templates: {
                    [template._id]: { insertEntities, displayColumns: template.propertiesOrder },
                },
            });
        },
        {
            onError() {
                toast.error(i18next.t('failedToExportTable'));
            },
            onSuccess(data) {
                fileDownload(data, `${template.displayName}.xlsx`);
            },
        },
    );

    const submitFunction = () => {
        if (stepsData.data.brokenRulesEntities)
            setCreateOrUpdateWithRuleBreachDialogState({
                isOpen: true,
                rawBrokenRules: stepsData.data.brokenRulesEntities.rawBrokenRules,
                brokenRules: stepsData.data.brokenRulesEntities.brokenRules,
                actions: stepsData.data.brokenRulesEntities.entities.map((properties) => {
                    return { actionType: ActionTypes.CreateEntity, actionMetadata: { templateId: template._id, properties } };
                }),
            });
        else handleClose();
    };

    const steps: StepsType<EntitiesWizardValues> = [
        {
            label: i18next.t('wizard.entity.loadEntities.downloadFileTitle'),
            description: i18next.t('wizard.entity.loadEntities.downloadFileDescription'),
            component: () => (
                <OpenPreview
                    fileId={`${i18next.t('entitiesTableOfTemplate.downloadOneTableTitle')}.xlsx`}
                    onClick={() =>
                        exportTemplateToExcel({
                            fileName: `${template.displayName}.xlsx`,
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
                    template={template}
                    stepsData={stepsData}
                    setStepsData={setStepsData}
                    exportTemplateToExcel={exportTemplateToExcel}
                />
            ),
            validationSchema: stepsData.status === 'initialSteps' ? attachmentPropertiesBaseSchema : {},
            stepperActions: {
                disable: stepsData.status === 'initialSteps' ? 'all' : undefined,
                back: {
                    onClick: () => {
                        if (stepsData.status === 'stepsPreview') {
                            setStepsData({
                                status: 'initialSteps',
                                data: { allEntities: [], succeededEntities: [], failedEntities: [] },
                            });
                        }
                    },
                },
                next: {
                    text: i18next.t('wizard.entity.loadEntities.loadEntities'),
                    onClick: async () => {
                        if (stepsData.status === 'stepsPreview') {
                            setStepsData((prev) => ({ ...prev, status: 'stepsExpand' }));

                            if (stepsData.data.failedEntities.length > 0)
                                await exportTemplateToExcel({
                                    fileName: `${template.displayName}: ${i18next.t('wizard.entity.loadEntities.failedEntities')}.xlsx`,
                                    insertEntities: {
                                        insert: true,
                                        entities: stepsData.data.failedEntities.map((entity) => entity.properties),
                                    },
                                });

                            const actions = stepsData.data.succeededEntities.map((properties) => ({
                                actionType: ActionTypes.CreateEntity,
                                actionMetadata: { templateId: template._id, properties },
                            }));
                            createBulkMutation({
                                actionsGroups: [actions],
                                ignoredRules: [],
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
                        template={template}
                        onDownload={(brokenRulesEntities?: boolean) => {
                            return exportTemplateToExcel({
                                fileName: `${template.displayName}: ${i18next.t(
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
                        isLoading={isExportingTableToExcelFile}
                    />
                );
            },
            stepperActions: {
                disable: 'back',
                next: {
                    text: stepsData.data.brokenRulesEntities?.brokenRules ? i18next.t('wizard.entity.loadEntities.handleRules') : undefined,
                },
            },
            invisibleBeforeStep: true,
        },
    ];

    return (
        <Grid>
            <Wizard
                open={open}
                handleClose={handleClose}
                initialValues={initialValues}
                // eslint-disable-next-line no-nested-ternary
                initialStep={1}
                isEditMode={isEditMode}
                title={i18next.t('wizard.entity.loadEntities.title')}
                // eslint-disable-next-line no-nested-ternary
                steps={steps}
                isLoading={false}
                submitFunction={submitFunction}
                direction="column"
                showPrevSteps
            />
            {createOrUpdateWithRuleBreachDialogState.isOpen && (
                <ActionOnEntityWithRuleBreachDialog
                    isLoadingActionOnEntity={isCreateBulkLoading}
                    handleClose={() => setCreateOrUpdateWithRuleBreachDialogState({ isOpen: false })}
                    doActionEntity={() => {
                        return createBulkMutation({
                            actionsGroups: [createOrUpdateWithRuleBreachDialogState.actions as IAction[]],
                            ignoredRules: createOrUpdateWithRuleBreachDialogState.rawBrokenRules,
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
                    onCreateRuleBreachRequest={() => handleClose()}
                    actions={createOrUpdateWithRuleBreachDialogState.actions}
                    rawActions={createOrUpdateWithRuleBreachDialogState.rawActions}
                />
            )}
        </Grid>
    );
};

export { LoadEntitiesWizard };
