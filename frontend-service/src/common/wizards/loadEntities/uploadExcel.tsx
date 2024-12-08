import React, { useState } from 'react';
import { FormikProps } from 'formik';
import i18next from 'i18next';
import * as XLSX from 'xlsx';
import { Grid, Typography, useTheme } from '@mui/material';
import { v4 as uuid } from 'uuid';
import { toast } from 'react-toastify';
import { EntitiesWizardValues, ISteps, StepStatus } from '.';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import OpenPreview from '../../FilePreview/OpenPreview';
import { environment } from '../../../globals';
import EntitiesTableOfTemplate from '../../EntitiesTableOfTemplate';
import { InstanceFileInput } from '../../inputs/InstanceFilesInput/InstanceFileInput';

const {
    agGrid: { defaultRowHeight, defaultFontSize },
    loadExcel: { excelExtension, acceptedFilesTypes, filesLimit, entitiesLimit },
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

    const [rowData, setRowData] = useState<any[]>([]);
    const [errorText, setErrorText] = useState<string | undefined>();

    const convertFileDataToRowData = (gridData: any[][], headers: string[]) => {
        return gridData
            .map((row) => {
                const rowObject: { [key: string]: any } = {};
                headers.forEach((header, index) => {
                    const key = Object.entries(template.properties.properties).find(([_, value]) => value.title === header)![0];
                    rowObject[key] = row[index] || '';
                });

                const isEmptyRow = Object.values(rowObject).every((value) => value === '' || value === undefined);

                return isEmptyRow ? null : { properties: rowObject };
            })
            .filter((rowObject) => rowObject !== null);
    };

    const importDataToGrid = (fileData: any[][]): { properties: Record<string, any> }[] | null => {
        if (fileData.length === 0) return null;

        const headers = fileData[0] as string[];
        const newRows = convertFileDataToRowData(fileData.slice(1), headers);
        return newRows || null;
    };

    const handleFilesChange = async (files: File[]): Promise<boolean> => {
        if (!files || files.length === 0) return false;

        setRowData([]);

        const entities: { properties: Record<string, any> }[] = [];
        const fileReadPromises = Array.from(files).map((file) => {
            return new Promise<void>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const binaryData = e.target?.result as ArrayBuffer;
                        const workbook = XLSX.read(binaryData, { type: 'array' });
                        const firstSheetName = workbook.SheetNames[0];
                        const worksheet = workbook.Sheets[firstSheetName];
                        const fileData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                        const newEntities = importDataToGrid(fileData);
                        if ((newEntities?.length || 0) > entitiesLimit) {
                            reject(new Error(file.name));
                        } else {
                            newEntities?.forEach((newEntity) => entities.push(newEntity));
                            resolve();
                        }
                    } catch (err) {
                        reject(err);
                    }
                };
                reader.onerror = () => reject(new Error('Error reading file'));
                reader.readAsArrayBuffer(file);
            });
        });

        try {
            await Promise.all(fileReadPromises);
            if (entities.length === 0) {
                toast.warn(i18next.t('wizard.entity.loadEntities.emptyExcel'));
                return false;
            }
            setRowData(entities);
            return true;
        } catch (error) {
            toast.error(`${i18next.t('wizard.entity.loadEntities.limitNumberEntities')} ${(error as Error).message}`);
            return false;
        }
    };

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
                    const validFiles = files.filter((file): file is File => file !== null);

                    if (validFiles.length > filesLimit) {
                        toast.error('wizard.entity.loadEntities.limitNumberFiles');
                        return;
                    }
                    const filesObject = validFiles.reduce<Record<string, File>>((acc, file) => {
                        return { ...acc, [file.name]: file };
                    }, {});

                    const isSucceed = await handleFilesChange(validFiles);
                    if (isSucceed) setStepsData((prev) => ({ ...prev, status: StepStatus.previewExcelRows, files: filesObject }));
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
            <Grid marginTop="10px">
                <OpenPreview
                    fileId={{ name: `${i18next.t('entitiesTableOfTemplate.downloadOneTableTitle')}${excelExtension}` } as File}
                    onClick={() => onDownload()}
                    download
                    showText
                />
            </Grid>
            <Grid marginTop="20px">
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
                    showErrors
                    showNavigateToRowButton={false}
                />
            </Grid>
        </Grid>
    );
};
