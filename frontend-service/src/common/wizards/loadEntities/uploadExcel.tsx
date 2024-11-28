import { FormikProps } from 'formik';
import React, { useState } from 'react';
import i18next from 'i18next';
import { toast } from 'react-toastify';
import { useMutation } from 'react-query';
import { Grid, Typography, useTheme } from '@mui/material';
import { v4 as uuid } from 'uuid';
import { AxiosError } from 'axios';
import { EntitiesWizardValues, ISteps, StepStatus } from '.';
import { readExcelEntitiesRequest } from '../../../services/entitiesService';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import OpenPreview from '../../FilePreview/OpenPreview';
import EntitiesTableOfTemplate from '../../EntitiesTableOfTemplate';
import { environment } from '../../../globals';
import { InstanceFileInput } from '../../inputs/InstanceFilesInput/InstanceFileInput';

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

    const [errorText, setErrorText] = useState<string | undefined>();

    const { isLoading: isReadingExcel, mutateAsync: readExcelEntities } = useMutation(
        async (files: Record<string, File>) => {
            return readExcelEntitiesRequest(files, template._id);
        },
        {
            async onSuccess(allEntities) {
                if (allEntities) {
                    setStepsData((prev) => ({ ...prev, status: StepStatus.stepsPreview, allEntities }));
                }
            },
            onError(error) {
                const { message, metadata } = (error as AxiosError).response!.data;

                if (message.includes('file limit'))
                    setErrorText(`${metadata.originalname}: ${i18next.t('wizard.entity.loadEntities.limitNumberEntities')}`);
                else if (message.includes('Invalid excel'))
                    setErrorText(`${metadata.originalname}: ${i18next.t('wizard.entity.loadEntities.invalidFile')}`);

                toast.error(i18next.t('wizard.entity.loadEntities.failedLoadEntities'));
            },
        },
    );

    if (stepsData.status === StepStatus.initialSteps)
        return (
            <InstanceFileInput
                {...formikProps}
                fileFieldName="file"
                fieldTemplateTitle=""
                comment={i18next.t('wizard.entity.loadEntities.onlyExcelFiles')}
                value={values.files}
                setFieldValue={setFieldValue}
                required={false}
                acceptedFilesTypes={{ 'excel/xlsx': ['.xlsx', '.xls'] }}
                setFieldTouched={setFieldTouched}
                error={errorText || formikProps.errors.files}
                setErrorText={setErrorText}
                onDrop={async (files) => {
                    const validFiles = files.filter((file): file is File => file !== null);

                    if (validFiles.length > 5) toast.error('wizard.entity.loadEntities.limitNumberFiles');
                    else {
                        const filesObject = validFiles.reduce<Record<string, File>>((acc, file) => {
                            return { ...acc, [file.name]: file };
                        }, {});

                        await readExcelEntities(filesObject);
                    }
                }}
                isLoading={isReadingExcel}
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
