/* eslint-disable react/no-unstable-nested-components */
import React from 'react';
import i18next from 'i18next';
import { toast } from 'react-toastify';
import fileDownload from 'js-file-download';
import { useMutation } from 'react-query';
import { StepsType, Wizard, WizardBaseType } from '..';
import OpenPreview from '../../FilePreview/OpenPreview';
import { InstanceFileInput } from '../../inputs/InstanceFilesInput/InstanceFileInput';
import { exportEntitiesRequest } from '../../../services/entitiesService';

export interface EntitiesWizardValues {
    file?: File;
}

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
                    [template._id]: { onlyColumns: true },
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
                const { setFieldTouched, values } = props;
                return (
                    <InstanceFileInput
                        {...props}
                        fileFieldName={i18next.t('wizard.entity.LoadEntitiesFromExcel.onlyExcelFiles')}
                        fieldTemplateTitle={i18next.t('wizard.entity.LoadEntitiesFromExcel.onlyExcelFiles')}
                        multipleFiles={false}
                        required={false}
                        acceptedFilesTypes={{ 'excel/xlsx': ['.xlsx', '.xls'] }}
                        setFieldTouched={setFieldTouched}
                        error={props.errors.file}
                        setFieldValue={props.setFieldValue}
                        value={values}
                    />
                );
            },
            // validationSchema:
        },
    ];

    return (
        <Wizard
            open={open}
            handleClose={handleClose}
            initialValues={initialValues}
            initialStep={0}
            isEditMode={isEditMode}
            title={i18next.t('entitiesTableOfTemplate.loadEntitiesTitle')}
            steps={steps}
            isLoading={false}
            submitFunction={(values) => mutateAsync(values)}
            direction="column"
            showPrevSteps
        />
    );
};

export { LoadEntitiesWizard };
