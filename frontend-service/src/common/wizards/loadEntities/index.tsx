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
        async () => {
            return exportEntitiesRequest({
                fileName: `${template.displayName}.xlsx`,
                templates: {
                    [template._id]: { emptySheet: true },
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
            onSuccess(data) {
                if (data) {
                    finishedDryRun = true;
                    tablesData = data;
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
                    onClick={() => exportTemplateToExcel()}
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
                return <LoadEntitiesTable {...props} tablesData={tablesData} template={template} />;
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
            title={i18next.t('entitiesTableOfTemplate.loadEntitiesTitle')}
            steps={finishedDryRun ? stepsExpand : steps}
            isLoading={false}
            submitFunction={(values) => mutateAsync(values)}
            direction="column"
            showPrevSteps
        />
    );
};

export { LoadEntitiesWizard };
