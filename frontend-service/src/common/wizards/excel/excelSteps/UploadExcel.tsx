import React, { useState } from 'react';
import { FormikProps } from 'formik';
import i18next from 'i18next';
import { CircularProgress, Grid, Typography, useTheme } from '@mui/material';
import { v4 as uuid } from 'uuid';
import { IMongoEntityTemplatePopulated } from '../../../../interfaces/entityTemplates';
import OpenPreview from '../../../FilePreview/OpenPreview';
import { environment } from '../../../../globals';
import EntitiesTableOfTemplate from '../../../EntitiesTableOfTemplate';
import { InstanceFileInput } from '../../../inputs/InstanceFilesInput/InstanceFileInput';
import { useReadExcel } from '../../../../utils/hooks/useReadExcel';
import { useWorkspaceStore } from '../../../../stores/workspace';
import { EntitiesWizardValues, IEditReadExcel, ISteps, StepStatus } from '../../../../interfaces/excel';

const {
    loadExcel: { excelExtension, acceptedFilesTypes },
} = environment;

export const UploadExcel: React.FC<{
    formikProps: FormikProps<EntitiesWizardValues>;
    template: IMongoEntityTemplatePopulated;
    stepsData: ISteps;
    setStepsData: React.Dispatch<React.SetStateAction<ISteps>>;
    onUploadExcel?: (file: Record<string, File>) => Promise<IEditReadExcel>;
    isLoading?: boolean;
}> = ({ formikProps, template, stepsData, setStepsData, onUploadExcel, isLoading }) => {
    const theme = useTheme();
    const { values, setFieldValue, setFieldTouched } = formikProps;

    const [errorText, setErrorText] = useState<string | undefined>();

    const { readFile, rowData } = useReadExcel();
    const workspace = useWorkspaceStore((state) => state.workspace);
    const { defaultRowHeight, defaultFontSize } = workspace.metadata.agGrid;
    const { entitiesFileLimit, filesLimit } = workspace.metadata.excel;

    if (isLoading) return <CircularProgress size={20} />;

    if (stepsData.status === StepStatus.uploadExcel)
        return (
            <>
                <Grid marginTop="10px" marginLeft="20px">
                    {!onUploadExcel && (
                        <Typography fontSize="13px" color="#9398C2">
                            - {i18next.t('wizard.entity.loadEntities.limitNumberEntities') + entitiesFileLimit}
                        </Typography>
                    )}

                    <Typography fontSize="13px" color="#9398C2" marginTop="5px">
                        - {`${i18next.t('wizard.entity.loadEntities.limitNumberFiles')} ${onUploadExcel ? 1 : filesLimit}`}
                    </Typography>
                </Grid>
                <InstanceFileInput
                    {...formikProps}
                    fileFieldName="file"
                    fieldTemplateTitle=""
                    comment={i18next.t('wizard.entity.loadEntities.onlyExcelFiles')}
                    value={values.files}
                    setFieldValue={setFieldValue}
                    required={false}
                    acceptedFilesTypes={acceptedFilesTypes}
                    setFieldTouched={setFieldTouched}
                    error={errorText || formikProps.errors.files}
                    setErrorText={setErrorText}
                    onDrop={async (files) => {
                        if (onUploadExcel) {
                            const file = files[0] as File;
                            const fileRecord: Record<string, File> = { [file.name]: file };
                            await onUploadExcel(fileRecord);
                            setStepsData((prev) => ({ ...prev, files: fileRecord }));
                        } else await readFile(files as File[], template, setStepsData);
                    }}
                    limit={onUploadExcel ? 1 : undefined}
                />
            </>
        );

    if (stepsData.status === StepStatus.excelUploadResult)
        return (
            <OpenPreview
                fileId={{ name: `${i18next.t('entitiesTableOfTemplate.downloadOneTableTitle')}${excelExtension}` } as File}
                download
                showText
            />
        );

    return (
        <Grid container direction="column" padding="5px">
            <Grid marginTop="5px">
                <OpenPreview
                    fileId={{ name: `${i18next.t('entitiesTableOfTemplate.downloadOneTableTitle')}${excelExtension}` } as File}
                    download
                    showText
                />
            </Grid>
            <Grid marginTop="15px">
                <Typography color={theme.palette.mode === 'dark' ? '#FFFFFF' : '#1E2775'} fontSize="14px" fontWeight={400}>
                    {i18next.t('wizard.entity.loadEntities.preview')}
                </Typography>
            </Grid>
            <Grid sx={{ marginTop: '10px', marginBottom: '10px', width: '100%' }}>
                <EntitiesTableOfTemplate
                    template={template}
                    getRowId={() => uuid()}
                    getEntityPropertiesData={(currentEntity) => currentEntity.properties}
                    rowModelType="clientSide"
                    rowHeight={defaultRowHeight}
                    pageRowCount={10}
                    fontSize={`${defaultFontSize}px`}
                    rowData={stepsData.entities || rowData}
                    saveStorageProps={{
                        shouldSaveFilter: false,
                        shouldSaveWidth: false,
                        shouldSaveVisibleColumns: false,
                        shouldSaveSorting: false,
                        shouldSaveColumnOrder: false,
                        shouldSavePagination: false,
                        shouldSaveScrollPosition: false,
                    }}
                    ignoreType
                    showNavigateToRowButton={false}
                    editable={false}
                />
            </Grid>
        </Grid>
    );
};
