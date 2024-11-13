import { FormikProps } from 'formik';
import React from 'react';
import i18next from 'i18next';
import { toast } from 'react-toastify';
import { useMutation } from 'react-query';
import { InstanceSingleFileInput } from '../../inputs/InstanceFilesInput/InstanceSingleFileInput';
import { EntitiesWizardValues, ISteps } from '.';
import { loadExcelEntitiesRequest } from '../../../services/entitiesService';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import OpenPreview from '../../FilePreview/OpenPreview';

export const UploadExcel: React.FC<{
    formikProps: FormikProps<EntitiesWizardValues>;
    template: IMongoEntityTemplatePopulated;
    steps: ISteps;
    setSteps: React.Dispatch<React.SetStateAction<ISteps>>;
}> = ({ formikProps, template, steps, setSteps }) => {
    const { values, setFieldValue, setFieldTouched } = formikProps;

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
                    console.log({ data });
                    setSteps({ status: 'stepsAfterFileUpload', data });

                    // TODO: delete or use automatic download failed entities
                    // if (data.failedEntities.length > 0)
                    //     await exportTemplateToExcel(
                    //         `${template.displayName}: ${i18next.t('wizard.entity.LoadEntitiesFromExcel.failedEntities')}.xlsx`,
                    //         {
                    //             insert: true,
                    //             entities: data.failedEntities.map((entity) => entity.properties),
                    //         },
                    //     );
                }
            },
        },
    );

    if (steps.status === 'initialSteps')
        return (
            <InstanceSingleFileInput
                {...formikProps}
                fileFieldName="file"
                fieldTemplateTitle={i18next.t('wizard.entity.LoadEntitiesFromExcel.onlyExcelFiles')}
                value={values.file}
                setFieldValue={setFieldValue}
                required
                acceptedFilesTypes={{ 'excel/xlsx': ['.xlsx', '.xls'] }}
                setFieldTouched={setFieldTouched}
                error={formikProps.errors.file}
                onDrop={(file: File) => loadExcelEntities(file)}
                isLoading={isLoadingExcelEntities}
                disableCamera
            />
        );

    return <OpenPreview fileId={formikProps.values.file!} type="preview" showText />;
};
