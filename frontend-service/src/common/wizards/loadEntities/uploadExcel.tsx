import React, { useState } from 'react';
import { FormikProps } from 'formik';
import i18next from 'i18next';
import { Grid, Typography, useTheme } from '@mui/material';
import { v4 as uuid } from 'uuid';
import { EntitiesWizardValues, ISteps, StepStatus } from '.';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import OpenPreview from '../../FilePreview/OpenPreview';
import { environment } from '../../../globals';
import EntitiesTableOfTemplate from '../../EntitiesTableOfTemplate';
import { InstanceFileInput } from '../../inputs/InstanceFilesInput/InstanceFileInput';
import { useReadExcel } from '../../../utils/hooks/useReadExcel';
<<<<<<< Updated upstream

const {
    agGrid: { defaultRowHeight, defaultFontSize },
=======
import { useWorkspaceStore } from '../../../stores/workspace';

const {
>>>>>>> Stashed changes
    loadExcel: { excelExtension, acceptedFilesTypes },
} = environment;

export const UploadExcel: React.FC<{
    formikProps: FormikProps<EntitiesWizardValues>;
    template: IMongoEntityTemplatePopulated;
    stepsData: ISteps;
    setStepsData: React.Dispatch<React.SetStateAction<ISteps>>;
    onDownload: () => Promise<any>;
}> = ({ formikProps, template, stepsData, setStepsData, onDownload }) => {
    const theme = useTheme();
    const { values, setFieldValue, setFieldTouched } = formikProps;

    const [errorText, setErrorText] = useState<string | undefined>();

    const { readFile, rowData } = useReadExcel();
<<<<<<< Updated upstream
=======
    const workspace = useWorkspaceStore((state) => state.workspace);
    const { defaultRowHeight, defaultFontSize } = workspace.metadata.agGrid;
>>>>>>> Stashed changes

    if (stepsData.status === StepStatus.uploadExcel)
        return (
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
                    await readFile(files as File[], template, setStepsData);
                }}
            />
        );

    if (stepsData.status === StepStatus.excelUploadResult)
        return (
            <OpenPreview
                fileId={{ name: `${i18next.t('entitiesTableOfTemplate.downloadOneTableTitle')}${excelExtension}` } as File}
                onClick={() => onDownload()}
                download
                showText
            />
        );

    return (
        <Grid container direction="column" padding="5px">
            <Grid marginTop="5px">
                <OpenPreview
                    fileId={{ name: `${i18next.t('entitiesTableOfTemplate.downloadOneTableTitle')}${excelExtension}` } as File}
                    onClick={() => onDownload()}
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
                    rowData={rowData}
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
