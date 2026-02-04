import { Grid } from '@mui/material';
import { AxiosError } from 'axios';
import i18next from 'i18next';
import fileDownload from 'js-file-download';
import React, { useState } from 'react';
import { useMutation } from 'react-query';
import { toast } from 'react-toastify';
import { environment } from '../../../globals';
import { ICreateOrUpdateWithRuleBreachDialogState } from '../../../interfaces/CreateOrEditEntityDialog';
import { IEntityWithIgnoredRules, IPropertyValue } from '../../../interfaces/entities';
import { EntitiesWizardValues, ExcelStepStatus, IExcelSteps } from '../../../interfaces/excel';
import { ActionTypes } from '../../../interfaces/ruleBreaches/actionMetadata';
import ActionOnEntityWithRuleBreachDialog from '../../../pages/Entity/components/ActionOnEntityWithRuleBreachDialog';
import { editManyEntitiesByExcelRequest, exportEntitiesRequest, getChangedEntitiesFromExcelRequest } from '../../../services/entitiesService';
import { useWorkspaceStore } from '../../../stores/workspace';
import { groupBrokenRulesByEntity } from '../../../utils/loadEntities';
import { isChildTemplate } from '../../../utils/templates';
import OpenPreview from '../../FilePreview/OpenPreview';
import { StepType, Wizard, WizardBaseType } from '..';
import { attachmentPropertiesBaseSchema } from '../entityTemplate/AddFields';
import { StatusEntitiesTables } from './excelSteps/StatusEntitiesTables';
import { UploadExcel } from './excelSteps/UploadExcel';

const { excelExtension } = environment.loadExcel;

const EditExcelWizard: React.FC<WizardBaseType<EntitiesWizardValues>> = ({
    open,
    handleClose,
    initialValues = {},
    initialStep = 1,
    isEditMode = false,
}) => {
    const { template } = initialValues!;
    const workspace = useWorkspaceStore((state) => state.workspace);
    const { entitiesFileLimit } = workspace.metadata.excel;

    const [stepsData, setStepsData] = useState<IExcelSteps>({
        status: ExcelStepStatus.uploadExcel,
        data: { succeededEntities: [], failedEntities: [] },
        entities: [],
    });

    const isBrokenRules = (stepsData.data.brokenRulesEntities?.brokenRules ?? []).length > 0;
    const [createOrUpdateWithRuleBreachDialogState, setCreateOrUpdateWithRuleBreachDialogState] = useState<ICreateOrUpdateWithRuleBreachDialogState>({
        isOpen: false,
    });

    const onClose = () => {
        handleClose();
        setStepsData({
            status: ExcelStepStatus.uploadExcel,
            entities: [],
            data: { succeededEntities: [], failedEntities: [] },
        });
    };

    const { isLoading: isLoadingReadExcel, mutateAsync: readExcel } = useMutation(
        async (file: Record<string, File>) => {
            const isChild = isChildTemplate(template!);
            const parentTemplateId = isChild ? template!.parentTemplate._id : template!._id;
            const childTemplateId = isChild ? template!._id : undefined;

            return getChangedEntitiesFromExcelRequest(parentTemplateId, file, childTemplateId);
        },
        {
            async onSuccess(data) {
                const { entities, failedEntities } = data;
                setStepsData((prev) => ({
                    ...prev,
                    status: ExcelStepStatus.previewExcelRows,
                    entities,
                    data: { failedEntities, succeededEntities: [] },
                }));

                return data;
            },
            onError(error: AxiosError) {
                // biome-ignore lint/suspicious/noExplicitAny: error is any
                const { message } = error.response?.data as any;
                if (message === 'Invalid excel') toast.error(i18next.t('wizard.entity.loadEntities.filesWrongTemplate'));
                else if (message.includes('file limit')) toast.error(i18next.t('wizard.entity.loadEntities.limitNumberEntities') + entitiesFileLimit);
                else toast.error(i18next.t('wizard.entity.editExcel.failedReadExcel'));
                onClose();
            },
        },
    );

    const { isLoading: isLoadingExcelEntities, mutateAsync: loadEntities } = useMutation(
        async (entities: IEntityWithIgnoredRules[]) => {
            return editManyEntitiesByExcelRequest(template!, entities);
        },
        {
            async onSuccess(data) {
                setStepsData((prev) => ({ ...prev, status: ExcelStepStatus.excelUploadResult, data }));
                return data;
            },
            onError() {
                toast.error(i18next.t('wizard.entity.loadEntities.failedLoadEntities'));
                onClose();
            },
        },
    );

    const { isLoading: isLoadingRules, mutateAsync: loadRules } = useMutation(
        async (entities: IEntityWithIgnoredRules[]) => {
            return editManyEntitiesByExcelRequest(template!, entities);
        },
        {
            async onSuccess(data) {
                setCreateOrUpdateWithRuleBreachDialogState({ isOpen: false });
                toast.success(i18next.t('wizard.entity.loadEntities.editedSuccessfully'));
                return data;
            },
            onError() {
                toast.error(i18next.t('wizard.entity.loadEntities.failedLoadEntities'));
            },
            onMutate() {
                onClose();
            },
        },
    );

    const { isLoading: isExportingTableToExcelFile, mutateAsync: exportTemplateToExcel } = useMutation(
        async ({
            fileName,
            headersOnly,
            insertEntities,
        }: {
            fileName: string;
            headersOnly?: boolean;
            insertEntities?: Record<string, IPropertyValue>[];
        }) => {
            return exportEntitiesRequest({
                fileName,
                templates: {
                    [template!._id]: {
                        headersOnly,
                        insertEntities,
                        displayColumns: template?.propertiesOrder,
                        isChildTemplate: isChildTemplate(template!),
                    },
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
            if (stepsData.data.succeededEntities.length > 0) toast.success(i18next.t('wizard.entity.loadEntities.createdSuccessfully'));
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
                        })
                    }
                    download
                    showText
                />
            ),
            validationSchema: {},
            stepperActions: { hide: 'all' },
        },
        {
            label: i18next.t('wizard.entity.loadEntities.uploadFilesTitle'),
            component: (props) => (
                <UploadExcel
                    formikProps={props}
                    template={template!}
                    stepsData={stepsData}
                    setStepsData={setStepsData}
                    onUploadExcel={(file: Record<string, File>) => readExcel(file)}
                    isLoading={isLoadingReadExcel}
                />
            ),
            validationSchema: stepsData.status === ExcelStepStatus.uploadExcel ? attachmentPropertiesBaseSchema : {},
            stepperActions: {
                hide: stepsData.status === ExcelStepStatus.uploadExcel ? 'all' : undefined,
                back: {
                    onClick: () => {
                        if (stepsData.status === ExcelStepStatus.previewExcelRows) {
                            setStepsData({
                                status: ExcelStepStatus.uploadExcel,
                                entities: [],
                                data: { succeededEntities: [], failedEntities: [] },
                            });
                        }
                    },
                },
                next: {
                    text: i18next.t('wizard.entity.loadEntities.loadEntities'),
                    onClick: async () => {
                        if (stepsData.status === ExcelStepStatus.previewExcelRows) {
                            setStepsData((prev) => ({ ...prev, status: ExcelStepStatus.excelUploadResult }));
                            const data = await loadEntities(stepsData.entities!);
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
                    <StatusEntitiesTables
                        {...props}
                        tablesData={{ ...stepsData.data, brokenRulesEntities: stepsData.data.brokenRulesEntities?.entities || [] }}
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
            <Wizard
                open={open}
                handleClose={onClose}
                initialValues={initialValues}
                initialStep={initialStep}
                isEditMode={isEditMode}
                title={`${i18next.t('wizard.entity.editExcel.title')} - ${template?.displayName}`}
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
                            status: ExcelStepStatus.uploadExcel,
                            entities: [],
                            data: { succeededEntities: [], failedEntities: [] },
                        });
                        onClose();
                    }}
                    doActionEntity={() => {
                        const brokenRulesEntities =
                            stepsData.data.brokenRulesEntities?.entities.map(({ properties }) => ({
                                templateId: template!._id,
                                properties,
                            })) || [];

                        const groupedRawBrokenRules = groupBrokenRulesByEntity(stepsData.data.brokenRulesEntities?.rawBrokenRules || []);
                        const insertBrokenEntities: IEntityWithIgnoredRules[] = brokenRulesEntities.map((brokenEntity, index) => ({
                            ...brokenEntity,
                            ignoredRules: groupedRawBrokenRules[index],
                        }));

                        return loadRules(insertBrokenEntities);
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

export { EditExcelWizard };
