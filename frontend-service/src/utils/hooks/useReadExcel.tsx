import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { toast } from 'react-toastify';
import i18next from 'i18next';
import { IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import { ISteps, StepStatus } from '../../common/wizards/loadEntities';
import { useWorkspaceStore } from '../../stores/workspace';

const convertFileDataToRowData = (gridData: any[][], headers: string[], template: IMongoEntityTemplatePopulated) => {
    return gridData
        .map((row) => {
            const rowObject: { [key: string]: any } = {};
            headers.forEach((header, index) => {
                const templateHeader = Object.entries(template.properties.properties).find(([_, value]) => value.title === header);
                if (!templateHeader) return;
                const key = templateHeader[0];
                rowObject[key] = row[index] || '';
            });

            const isEmptyRow = Object.values(rowObject).every((value) => value === '' || value === undefined);

            return isEmptyRow ? null : { properties: rowObject };
        })
        .filter((rowObject): rowObject is { properties: Record<string, any> } => rowObject !== null);
};

const importDataToGrid = (fileData: any[][], template: IMongoEntityTemplatePopulated): { properties: Record<string, any> }[] => {
    if (fileData.length === 0) return [];

    const headers = fileData[0] as string[];
    const newRows = convertFileDataToRowData(fileData.slice(1), headers, template);
    return newRows;
};

const createFileObject = (files?: File[]): Record<string, File> | undefined => {
    const validFiles = files?.filter((file): file is File => file !== null);

    return validFiles?.reduce<Record<string, File>>((acc, file) => {
        return { ...acc, [file.name]: file };
    }, {});
};

export const useReadExcel = () => {
    const [rowData, setRowData] = useState<any[]>([]);
    const workspace = useWorkspaceStore((state) => state.workspace);
    const readFile = async (
        files: File[],
        template: IMongoEntityTemplatePopulated,
        setStepsData: React.Dispatch<React.SetStateAction<ISteps>>,
    ): Promise<void> => {
        const fileObject = createFileObject(files);

        if (!fileObject) return;

        setRowData([]);

        const entities: { properties: Record<string, any> }[] = [];
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

                        const fileData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                        const newEntities = importDataToGrid(fileData, template);
                        newEntities?.forEach((newEntity) => entities.push(newEntity));
                        resolve();
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
                return;
            }

            setRowData(entities);
            setStepsData((prev) => ({ ...prev, status: StepStatus.previewExcelRows, files: fileObject }));
        } catch (error) {
            if ((error as Error).message === 'Invalid File Type') toast.error(i18next.t('wizard.entity.loadEntities.wrongFileType'));
            else if ((error as Error).message === 'files limit')
                toast.error(i18next.t(`wizard.entity.loadEntities.limitNumberFiles ${workspace.metadata.excel.filesLimit}`));
            else if ((error as Error).message === 'file limit')
                toast.error(
                    `${i18next.t(`wizard.entity.loadEntities.limitNumberEntities ${workspace.metadata.excel.entitiesFileLimit}`)} ${
                        (error as any).metadata
                    }`,
                );
            else if ((error as Error).message.includes('wrong template')) toast.error(i18next.t('wizard.entity.loadEntities.filesWrongTemplate'));
            else toast.error(i18next.t('wizard.entity.loadEntities.failedReadingFiles'));
        }
    };

    return { readFile, rowData };
};
