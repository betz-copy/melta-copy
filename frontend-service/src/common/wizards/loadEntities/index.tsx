/* eslint-disable react/no-unstable-nested-components */
import React from 'react';
import i18next from 'i18next';
import { toast } from 'react-toastify';
import fileDownload from 'js-file-download';
import { useMutation } from 'react-query';
import { StepsType, Wizard, WizardBaseType } from '..';
import OpenPreview from '../../FilePreview/OpenPreview';
import { exportEntitiesRequest, loadExcelEntitiesRequest } from '../../../services/entitiesService';
import { attachmentPropertiesBaseSchema } from '../entityTemplate/AddFields';
import { InstanceSingleFileInput } from '../../inputs/InstanceFilesInput/InstanceSingleFileInput';
import { LoadEntitiesTable } from './loadEntitiesTable';

export interface EntitiesWizardValues {
    file?: File;
}

let finishedDryRun = false;
let tablesData = { succeededEntities: [], failedEntities: [] };

const LoadEntitiesWizard: React.FC<WizardBaseType<EntitiesWizardValues>> = ({
    open,
    handleClose,
    initialValues = { file: undefined },
    isEditMode = false,
    template,
}) => {
    const { isLoading: isExportingTableToExcelFile, mutateAsync: exportTemplateToExcel } = useMutation(
        async (fileName: string, insertEntities?: { insert: boolean; entities?: Record<string, any>[] }) => {
            console.log({ fileName, insertEntities });

            return exportEntitiesRequest({
                fileName,
                templates: {
                    [template._id]: { insertEntities },
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

    const { isLoading: isLoadingExcelEntities, mutateAsync: loadExcelEntities } = useMutation(
        async (file: File) => {
            return loadExcelEntitiesRequest(file, template._id);
        },
        {
            onError() {
                toast.error(i18next.t('wizard.entity.LoadEntitiesFromExcel.failedLoadEntities'));
            },
            async onSuccess(data) {
                if (data) {
                    finishedDryRun = true;
                    tablesData = data;
                    console.log({
                        insert: true,
                        entities: data.failedEntities.map((entity) => entity.properties),
                    });

                    await exportTemplateToExcel(`${template.displayName}: ${i18next.t('wizard.entity.LoadEntitiesFromExcel.failedEntities')}.xlsx`, {
                        insert: true,
                        entities: data.failedEntities.map((entity) => entity.properties),
                    });
                }
                console.log({ data });
            },
        },
    );

    const steps: StepsType<EntitiesWizardValues> = [
        {
            label: i18next.t('wizard.entity.LoadEntitiesFromExcel.downloadFileTitle'),
            description: i18next.t('wizard.entity.LoadEntitiesFromExcel.downloadFileDescription'),
            component: () => (
                <OpenPreview
                    fileId={`${i18next.t('entitiesTableOfTemplate.downloadOneTableTitle')}.xlsx`}
                    onClick={() => exportTemplateToExcel(`${template.displayName} .xlsx`, { insert: true })}
                    loading={isExportingTableToExcelFile}
                    type="exportTable"
                    showText
                />
            ),
            validationSchema: {},
        },
        {
            label: i18next.t('wizard.entity.LoadEntitiesFromExcel.uploadFilesTitle'),
            component: (props) => {
                const { values, setFieldValue, setFieldTouched } = props;

                return (
                    <InstanceSingleFileInput
                        {...props}
                        fileFieldName="file"
                        fieldTemplateTitle={i18next.t('wizard.entity.LoadEntitiesFromExcel.onlyExcelFiles')}
                        value={values.file}
                        setFieldValue={setFieldValue}
                        required
                        acceptedFilesTypes={{ 'excel/xlsx': ['.xlsx', '.xls'] }}
                        setFieldTouched={setFieldTouched}
                        error={props.errors.file}
                        onDrop={(file: File) => loadExcelEntities(file)}
                        isLoading={isLoadingExcelEntities}
                        disableCamera
                    />
                );
            },
            validationSchema: attachmentPropertiesBaseSchema,
        },
    ];

    const stepsExpand: StepsType<EntitiesWizardValues> = [
        steps[0],
        {
            label: i18next.t('wizard.entity.LoadEntitiesFromExcel.uploadFilesTitle'),
            component: (props) => <OpenPreview fileId={props.values.file!} type="preview" showText />,
            validationSchema: {},
        },
        {
            label: i18next.t('wizard.entity.LoadEntitiesFromExcel.entitiesStatus'),
            component: (props) => {
                return (
                    <LoadEntitiesTable
                        {...props}
                        tablesData={tablesData}
                        template={template}
                        handleClose={handleClose}
                        // onDownload={exportTemplateToExcel(
                        //     `${template.displayName}: ${i18next.t('wizard.entity.LoadEntitiesFromExcel.failedEntities')}.xlsx`,
                        //     {
                        //         insert: true,
                        //         entities: tablesData.failedEntities.map((entity) => entity.properties),
                        //     },
                        // )}
                        isDownloadLoading={isLoadingExcelEntities}
                    />
                );
            },
            validationSchema: attachmentPropertiesBaseSchema,
        },
    ];

    return (
        <Wizard
            open={open}
            handleClose={handleClose}
            initialValues={initialValues}
            initialStep={finishedDryRun ? 2 : 1}
            isEditMode={isEditMode}
            title={i18next.t('wizard.entity.LoadEntitiesFromExcel.title')}
            steps={finishedDryRun ? stepsExpand : steps}
            isLoading={false}
            submitFunction={async () => handleClose()}
            direction="column"
            showPrevSteps
        />
    );
};

export { LoadEntitiesWizard };
