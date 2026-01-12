import { IMongoEntityTemplateWithConstraintsPopulated } from '@packages/entity-template';
import i18next from 'i18next';
import React, { useState } from 'react';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';
import { ExcelStepStatus, IExcelSteps } from '../../interfaces/excel';
import { useWorkspaceStore } from '../../stores/workspace';

const convertFileDataToRowData = (
    gridData: (string | number | null)[][],
    headers: string[],
    template: IMongoEntityTemplateWithConstraintsPopulated,
) => {
    return gridData
        .map((row) => {
            const rowObject: Record<string, IPropertyValue> = {};
            headers.forEach((header, index) => {
                const templateHeader = Object.entries(template.properties.properties).find(([_, value]) => value.title === header);
                if (!templateHeader) return;
                const key = templateHeader[0];
                rowObject[key] = row[index] || '';
            });

            const isEmptyRow = !Object.values(rowObject).some((value) => value !== '' && value !== undefined);

            return isEmptyRow ? null : { properties: rowObject };
        })
        .filter((rowObject) => rowObject !== null);
};

const importDataToGrid = (
    fileData: (string | number | null)[][],
    template: IMongoEntityTemplateWithConstraintsPopulated,
): { properties: Record<string, IPropertyValue> }[] | [] => {
    if (!fileData.length) return [];

    const headers = fileData[0] as string[];
    const newRows = convertFileDataToRowData(fileData.slice(1), headers, template);
    return (newRows || []).filter((row): row is { properties: Record<string, IPropertyValue> } => row !== null);
};

const createFileObject = (filesLimit: number, files?: File[]): Record<string, File> | undefined => {
    const validFiles = files?.filter((file): file is File => file !== null);

    if (!validFiles?.length || validFiles?.length > filesLimit) {
        toast.error(i18next.t('wizard.entity.loadEntities.limitNumberFiles') + filesLimit);
        return undefined;
    }

    const filesMap: Record<string, File> = {};
    for (const file of validFiles) {
        filesMap[file.name] = file;
    }

    return filesMap;
};

export const useReadExcel = () => {
    const [rowData, setRowData] = useState<{ properties: Record<string, IPropertyValue> }[]>([]);
    const workspace = useWorkspaceStore((state) => state.workspace);
    const { entitiesFileLimit, filesLimit } = workspace.metadata.excel;

    const readFile = async (
        files: File[],
        template: IMongoEntityTemplateWithConstraintsPopulated,
        setStepsData: React.Dispatch<React.SetStateAction<IExcelSteps>>,
    ): Promise<void> => {
        const fileObject = createFileObject(filesLimit, files);

        if (!fileObject) return;

        setRowData([]);

        const entities: { properties: Record<string, IPropertyValue> }[] = [];
        const fileReadPromises = Array.from(Object.values(fileObject)).map((file) => {
            const excelExtension = ['.xlsx', '.xls'];
            if (!excelExtension.some((ext) => file.name.toLowerCase().endsWith(ext))) throw new Error('Invalid File Type');
            return new Promise<void>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const binaryData = e.target?.result as ArrayBuffer;
                        const workbook = XLSX.read(binaryData, { type: 'array' });
                        const firstSheetName = workbook.SheetNames[0];
                        const worksheet = workbook.Sheets[firstSheetName];

                        const worksheetName = Object.keys(workbook.Sheets)[0] as string;
                        if (template.displayName.trim() !== worksheetName.trim()) throw new Error('Invalid File: wrong template');
                        const fileData: (string | number | null)[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                        const newEntities = importDataToGrid(fileData, template);
                        if ((newEntities?.length || 0) > entitiesFileLimit) reject(new Error(file.name));
                        else {
                            newEntities?.forEach((newEntity) => {
                                entities.push(newEntity);
                            });
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
            if (!entities.length) {
                toast.warn(i18next.t('wizard.entity.loadEntities.emptyExcel'));
                return;
            }

            setRowData(entities);
            setStepsData((prev) => ({ ...prev, status: ExcelStepStatus.previewExcelRows, files: fileObject }));
        } catch (error) {
            if ((error as Error).message === 'Invalid File Type') toast.error(i18next.t('wizard.entity.loadEntities.wrongFileType'));
            if (files.some((file) => file.name === (error as Error).message))
                toast.error(`${i18next.t('wizard.entity.loadEntities.limitNumberEntities') + entitiesFileLimit} ${(error as Error).message}`);
            else if ((error as Error).message.includes('wrong template')) toast.error(i18next.t('wizard.entity.loadEntities.filesWrongTemplate'));
            else toast.error(i18next.t('wizard.entity.loadEntities.failedReadingFiles'));
        }
    };

    return { readFile, rowData };
};
