import { FormikProps } from 'formik';
import React from 'react';
import i18next from 'i18next';
import { toast } from 'react-toastify';
import { useMutation } from 'react-query';
import { Grid, Typography } from '@mui/material';
import { InstanceSingleFileInput } from '../../inputs/InstanceFilesInput/InstanceSingleFileInput';
import { EntitiesWizardValues, ISteps } from '.';
import { loadExcelEntitiesRequest } from '../../../services/entitiesService';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import OpenPreview from '../../FilePreview/OpenPreview';
import EntitiesTableOfTemplate from '../../EntitiesTableOfTemplate';
import { environment } from '../../../globals';

const { defaultRowHeight, defaultFontSize } = environment.agGrid;

export const UploadExcel: React.FC<{
    formikProps: FormikProps<EntitiesWizardValues>;
    template: IMongoEntityTemplatePopulated;
    stepsData: ISteps;
    setStepsData: React.Dispatch<React.SetStateAction<ISteps>>;
}> = ({ formikProps, template, stepsData, setStepsData }) => {
    const { values, setFieldValue, setFieldTouched } = formikProps;

    const { isLoading: isLoadingExcelEntities, mutateAsync: loadExcelEntities } = useMutation(
        async (file: File) => {
            return loadExcelEntitiesRequest(file, template._id);
        },
        {
            onError() {
                toast.error(i18next.t('wizard.entity.loadEntities.failedLoadEntities'));
            },
            async onSuccess(data) {
                if (data) {
                    console.log({ data });
                    setStepsData({ status: 'stepsPreview', data });
                }
            },
        },
    );

    if (stepsData.status === 'initialSteps')
        return (
            <InstanceSingleFileInput
                {...formikProps}
                fileFieldName="file"
                fieldTemplateTitle={i18next.t('wizard.entity.loadEntities.onlyExcelFiles')}
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
    if (stepsData.status === 'stepsExpand') return <OpenPreview fileId={formikProps.values.file!} type="preview" showText />;

    return (
        <Grid container direction="column" padding="5px">
            <Grid marginTop="10px">
                <OpenPreview fileId={formikProps.values.file!} type="preview" showText />
            </Grid>
            <Grid>
                <Grid paddingTop="10px">
                    <Typography color="#1E2775" fontSize="14px" fontWeight={400}>
                        {i18next.t('wizard.entity.loadEntities.preview')}
                    </Typography>
                </Grid>
                <Grid sx={{ marginTop: '10px', marginBottom: '30px', width: '100%' }}>
                    <EntitiesTableOfTemplate
                        template={template}
                        getRowId={(currentEntity) => currentEntity.properties._id}
                        getEntityPropertiesData={(currentEntity) => currentEntity.properties}
                        rowModelType="clientSide"
                        rowHeight={defaultRowHeight}
                        pageRowCount={10}
                        fontSize={`${defaultFontSize}px`}
                        rowData={stepsData.data.allEntities}
                        saveStorageProps={{
                            shouldSaveFilter: false,
                            shouldSaveWidth: false,
                            shouldSaveVisibleColumns: false,
                            shouldSaveSorting: false,
                            shouldSaveColumnOrder: false,
                            shouldSavePagination: false,
                            shouldSaveScrollPosition: false,
                        }}
                        showErrors
                    />
                </Grid>
            </Grid>
        </Grid>
    );
};
