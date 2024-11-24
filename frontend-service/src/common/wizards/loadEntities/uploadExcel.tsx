import { FormikProps } from 'formik';
import React from 'react';
import i18next from 'i18next';
import { toast } from 'react-toastify';
import { useMutation } from 'react-query';
import { Grid, Typography, useTheme } from '@mui/material';
import { v4 as uuid } from 'uuid';
import { InstanceSingleFileInput } from '../../inputs/InstanceFilesInput/InstanceSingleFileInput';
import { EntitiesWizardValues, ISteps, StepStatus } from '.';
import { readExcelEntitiesRequest } from '../../../services/entitiesService';
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
    isLoading: boolean;
    onDownload: () => Promise<any>;
}> = ({ formikProps, template, stepsData, setStepsData, isLoading, onDownload }) => {
    const theme = useTheme();
    const { values, setFieldValue, setFieldTouched } = formikProps;

    const { isLoading: isReadingExcel, mutateAsync: readExcelEntities } = useMutation(
        async (file: File) => {
            return readExcelEntitiesRequest(file, template._id);
        },
        {
            onError() {
                toast.error(i18next.t('wizard.entity.loadEntities.failedLoadEntities'));
            },
            async onSuccess(allEntities) {
                if (allEntities) {
                    setStepsData((prev) => ({ ...prev, status: StepStatus.stepsPreview, allEntities }));
                }
            },
        },
    );

    if (stepsData.status === StepStatus.initialSteps)
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
                onDrop={(file: File) => readExcelEntities(file)}
                isLoading={isReadingExcel}
                disableCamera
            />
        );

    if (stepsData.status === StepStatus.stepsExpand)
        return (
            <OpenPreview
                fileId={`${i18next.t('entitiesTableOfTemplate.downloadOneTableTitle')}.xlsx`}
                onClick={() => onDownload()}
                loading={isLoading}
                type="exportTable"
                showText
            />
        );

    return (
        <Grid container direction="column" padding="5px">
            <Grid marginTop="10px">
                <OpenPreview
                    fileId={`${i18next.t('entitiesTableOfTemplate.downloadOneTableTitle')}.xlsx`}
                    onClick={() => onDownload()}
                    loading={isLoading}
                    type="exportTable"
                    showText
                />
            </Grid>
            <Grid>
                <Grid paddingTop="10px">
                    <Typography color={theme.palette.mode === 'dark' ? '#FFFFFF' : '#1E2775'} fontSize="14px" fontWeight={400}>
                        {i18next.t('wizard.entity.loadEntities.preview')}
                    </Typography>
                </Grid>
                <Grid sx={{ marginTop: '10px', marginBottom: '10px', width: '100%' }}>
                    <EntitiesTableOfTemplate
                        template={template}
                        getRowId={() => uuid()}
                        getEntityPropertiesData={(currentEntity) =>
                            currentEntity.properties as {
                                _id: string;
                                createdAt: string;
                                updatedAt: string;
                                disabled: boolean;
                            } & Record<string, any>
                        }
                        rowModelType="clientSide"
                        rowHeight={defaultRowHeight}
                        pageRowCount={10}
                        fontSize={`${defaultFontSize}px`}
                        rowData={stepsData.allEntities}
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
                        showNavigateToRowButton={false}
                    />
                </Grid>
            </Grid>
        </Grid>
    );
};
