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
import { LoadEntitiesTable } from './loadEntitiesTable';
import { IBrokenRule, IBrokenRulePopulated } from '../../../interfaces/ruleBreaches/ruleBreach';
import { IEntitySingleProperty } from '../../../interfaces/entityTemplates';
import { AllEntities } from './allEntities';
import { UploadExcel } from './uploadExcel';
import ActionOnEntityWithRuleBreachDialog from '../../../pages/Entity/components/ActionOnEntityWithRuleBreachDialog';
import { ActionTypes, IAction } from '../../../interfaces/ruleBreaches/actionMetadata';
import { ICreateOrUpdateWithRuleBreachDialogState } from '../../dialogs/entity/CreateOrEditEntityDialog';

export interface EntitiesWizardValues {
    file?: File;
}
type IErrorProperty = { message: string; path: string; schemaPath: string; params: Partial<IEntitySingleProperty> };
export interface ITablesData {
    succeededEntities: { templateId: string; properties: Record<string, any> }[];
    failedEntities: {
        properties: Record<string, any>;
        errors: IErrorProperty[];
    }[];
    brokenRulesEntities?: { rawBrokenRules: IBrokenRule[]; brokenRules: IBrokenRulePopulated[]; entities: { properties: Record<string, any> }[] };
}

interface ITablesEntities extends ITablesData {
    allEntities: { properties: Record<string, any> }[];
}

export interface ISteps {
    status: 'initialSteps' | 'stepsAfterFileUpload' | 'stepsExpand';
    data: ITablesEntities;
}

const LoadEntitiesWizard: React.FC<WizardBaseType<EntitiesWizardValues>> = ({
    open,
    handleClose,
    initialValues = { file: undefined },
    isEditMode = false,
    template,
}) => {
    const [steps, setSteps] = useState<ISteps>({
        status: 'initialSteps',
        data: { allEntities: [], succeededEntities: [], failedEntities: [] },
    });
    const [createOrUpdateWithRuleBreachDialogState, setCreateOrUpdateWithRuleBreachDialogState] = useState<ICreateOrUpdateWithRuleBreachDialogState>({
        isOpen: false,
    });

    const { isLoading: isCreateBulkLoading, mutateAsync: createBulkMutation } = useMutation(
        ({ actionsGroups, ignoredRules, dryRun }: { actionsGroups: IAction[][]; ignoredRules?: IBrokenRule[]; dryRun?: boolean }) =>
            runBulkOfActionsRequest(actionsGroups, ignoredRules, dryRun),
        {
            onSuccess: (data) => {
                console.log({ data });
            },
            onError: (err: AxiosError) => {
                console.log({ err });
            },
        },
    );

    interface InsertEntities {
        insert: boolean;
        entities?: Record<string, any>[];
    }

    interface ExportRequestParams {
        fileName: string;
        insertEntities?: InsertEntities;
    }

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
        if (steps.status === 'stepsAfterFileUpload') setSteps((prev) => ({ ...prev, status: 'stepsExpand' }));
        else if (steps.status === 'stepsExpand') {
            if (steps.data.brokenRulesEntities)
                setCreateOrUpdateWithRuleBreachDialogState({
                    isOpen: true,
                    rawBrokenRules: steps.data.brokenRulesEntities.rawBrokenRules,
                    brokenRules: steps.data.brokenRulesEntities.brokenRules,
                    actions: steps.data.brokenRulesEntities.entities.map((properties) => {
                        return { actionType: ActionTypes.CreateEntity, actionMetadata: { templateId: template._id, properties } };
                    }),
                });
            else handleClose();
        }
    };

    const initialSteps: StepsType<EntitiesWizardValues> = [
        {
            label: i18next.t('wizard.entity.LoadEntitiesFromExcel.downloadFileTitle'),
            description: i18next.t('wizard.entity.LoadEntitiesFromExcel.downloadFileDescription'),
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
            label: i18next.t('wizard.entity.LoadEntitiesFromExcel.uploadFilesTitle'),
            component: (props) => <UploadExcel formikProps={props} template={template} steps={steps} setSteps={setSteps} />,
            validationSchema: attachmentPropertiesBaseSchema,
            stepperActions: { disable: 'all' },
        },
    ];

    const stepsAfterFileUpload: StepsType<EntitiesWizardValues> = [
        ...initialSteps,
        {
            label: i18next.t('wizard.entity.LoadEntitiesFromExcel.allEntities'),
            description: i18next.t('wizard.entity.LoadEntitiesFromExcel.allEntitiesDescription'),
            component: (props) => {
                return <AllEntities {...props} allEntities={steps.data.allEntities} template={template} steps={steps} />;
            },
            stepperActions: {
                handleBack: () => {
                    setSteps({
                        status: 'initialSteps',
                        data: { allEntities: [], succeededEntities: [], failedEntities: [] },
                    });
                },
            },
        },
    ];

    const stepsExpand: StepsType<EntitiesWizardValues> = [
        ...stepsAfterFileUpload,
        {
            label: i18next.t('wizard.entity.LoadEntitiesFromExcel.entitiesStatus'),
            component: (props) => {
                return (
                    <LoadEntitiesTable
                        {...props}
                        tablesData={steps.data}
                        template={template}
                        onDownload={() => {
                            return exportTemplateToExcel({
                                fileName: `${template.displayName}: ${i18next.t('wizard.entity.LoadEntitiesFromExcel.failedEntities')}.xlsx`,
                                insertEntities: {
                                    insert: true,
                                    entities: steps.data.failedEntities.map((entity) => entity.properties),
                                },
                            });
                        }}
                        isDownloadLoading={isExportingTableToExcelFile}
                    />
                );
            },
            validationSchema: attachmentPropertiesBaseSchema,
            stepperActions: { disable: 'back' },
        },
    ];

    return (
        <Grid>
            <Wizard
                open={open}
                handleClose={handleClose}
                initialValues={initialValues}
                // eslint-disable-next-line no-nested-ternary
                initialStep={steps.status === 'initialSteps' ? 1 : steps.status === 'stepsAfterFileUpload' ? 2 : 3}
                isEditMode={isEditMode}
                title={i18next.t('wizard.entity.LoadEntitiesFromExcel.title')}
                // eslint-disable-next-line no-nested-ternary
                steps={steps.status === 'initialSteps' ? initialSteps : steps.status === 'stepsAfterFileUpload' ? stepsAfterFileUpload : stepsExpand}
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
