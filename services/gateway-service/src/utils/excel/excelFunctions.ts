/* eslint-disable no-param-reassign */
import Excel from 'exceljs';
import { v4 as uuidv4 } from 'uuid';
import { IEntitySingleProperty, IMongoEntityTemplatePopulated, IEntity } from '@microservices/shared';
import config from '../../config/index';
import excelConfig from './excelConfig';
import hexToARGB from './colors';

interface IExcelStyle {
    columnHeader: {
        font: Partial<Excel.Font>;
        alignment: Partial<Excel.Alignment>;
    };
    cell: {
        font: Partial<Excel.Font>;
        alignment: Partial<Excel.Alignment>;
    };
}

const excelStyle: IExcelStyle = {
    columnHeader: {
        font: {
            bold: true,
            name: 'Ariel',
            family: 2,
            size: 14,
        },
        alignment: {
            vertical: 'middle',
            horizontal: 'center',
        },
    },
    cell: {
        font: {
            bold: false,
            size: 12,
            name: 'Ariel',
            family: 2,
        },
        alignment: {
            vertical: 'middle',
        },
    },
};

const createWorkbook = async (fileName: string) => {
    const fileOption = {
        filename: `${config.service.excelFilePath}/${uuidv4()}${fileName}`,
        useStyles: true,
        useSharedStrings: true,
    };
    return {
        workbook: new Excel.stream.xlsx.WorkbookWriter(fileOption),
        filePath: fileOption.filename,
    };
};

const createWorksheet = async (workbook: Excel.Workbook, template: IMongoEntityTemplatePopulated, displayColumns: string[]) => {
    const worksheet = workbook.addWorksheet(template.displayName);
    const { properties } = template.properties;

    const sheetColumns: Partial<Excel.Column>[] = displayColumns
        .filter((key) => properties[key])
        .map((key) => ({
            key,
            header: properties[key].title,
            width: config.excel.columnWidth,
        }));

    const externalColumns = excelConfig.excelDefaultColumns.filter((externalColumn) => displayColumns.includes(externalColumn.key));
    worksheet.columns = sheetColumns.concat(externalColumns);
    return worksheet;
};

export const getFileName = (fileId: string) => {
    return fileId.slice(config.storageService.fileIdLength);
};

const relationshipRefCell = (cell: Excel.Cell, [key, value]: [string, IEntitySingleProperty], row: Record<string, any>, workspacePath: string) => {
    cell.value = {
        text: row[key].properties[value.relationshipReference!.relatedTemplateField],
        hyperlink: `${config.service.meltaBaseUrl}${workspacePath}/entity/${row[key].properties._id}`,
    };
};

const filesCell = (cell: Excel.Cell, isFileArray: boolean, rowIndex: number, value: string, workspaceId: string) => {
    cell.value = {
        text: isFileArray ? `${config.excel.multipleFilesName}${rowIndex}` : getFileName(value),
        hyperlink: `${config.service.meltaBaseUrl}${config.storageService.baseRoute}/${isFileArray ? 'zip/' : ''}${encodeURIComponent(value)}/${workspaceId}`,
    };
};

const fixComplexProperties = (
    cell: Excel.Cell,
    row: Record<string, any>,
    [key, value]: [string, IEntitySingleProperty],
    rowIndex: number,
    workspace: { path: string; id: string },
) => {
    const isFileArray = value.type === 'array' && value.items?.format === 'fileId';
    const isSingleFile = value.format === 'fileId';

    if (value.format === 'relationshipReference') {
        relationshipRefCell(cell, [key, value], row, workspace.path);
        return true;
    }
    if (isSingleFile || isFileArray) {
        filesCell(cell, isFileArray, rowIndex, row[key], workspace.id);
        return true;
    }
    return false;
};

const indexToExcelColumn = (index: number): string => {
    let columnName = '';
    const NUMBER_OF_ENGLISH_LETTERS = 26;
    const A_ASCII_CODE = 65;

    while (index > 0) {
        index--;
        columnName = String.fromCharCode((index % NUMBER_OF_ENGLISH_LETTERS) + A_ASCII_CODE) + columnName;
        index = Math.floor(index / NUMBER_OF_ENGLISH_LETTERS);
    }

    return columnName;
};

const styleAWorksheet = (
    worksheet: Excel.Worksheet,
    rows: IEntity['properties'][],
    template: IMongoEntityTemplatePopulated,
    displayColumns: string[],
    workspace: { path: string; id: string },
) => {
    worksheet.getRow(1).eachCell((cell) => {
        cell.font = excelStyle.columnHeader.font;
        cell.alignment = excelStyle.columnHeader.alignment;
    });
    const { properties } = template.properties;
    const { createdAt, updatedAt, disabled } = template;

    const allProperties: Record<string, any> = Object.entries({ ...properties, disabled, createdAt, updatedAt })
        .filter(([key]) => displayColumns.includes(key))
        .reduce((acc, [key, value]) => {
            acc[key] = value;
            return acc;
        }, {});

    Object.entries(allProperties).forEach(([key, value], columnIndex) => {
        rows.forEach((row, rowIndex) => {
            const cell = worksheet.getCell(`${indexToExcelColumn(columnIndex + 1)}${rowIndex + 2}`);
            if (row[key] !== undefined) {
                cell.alignment = excelStyle.cell.alignment;
                cell.font = excelStyle.cell.font;

                const isComplex = fixComplexProperties(cell, row, [key, value], rowIndex, workspace);

                if (!isComplex) {
                    cell.value = row[key];
                    if (typeof cell.value === 'boolean') {
                        cell.value = cell.value ? excelConfig.TRUE_TO_HEBREW : excelConfig.FALSE_TO_HEBREW;
                    }
                    // Check if value is date
                    if (cell.value && typeof cell.value === 'string') {
                        const cellValue = String(cell.value);

                        if (excelConfig.regexOfDateFormat.test(cellValue)) {
                            const date = new Date(cellValue);

                            if (cellValue.includes(':')) {
                                cell.value = date;
                                cell.numFmt = 'dd/mm/yyyy hh:mm';
                            } else {
                                cell.value = new Date(date.setHours(0, 0, 0, 0));
                                cell.numFmt = 'dd/mm/yyyy';
                            }
                        }
                    }
                    // Check if value is html tags when format is text area
                    if (excelConfig.regexOfTextAreaFormat.test(String(cell.value))) {
                        cell.value = String(cell.value).replace(/<[^>]*>/g, '');
                        cell.alignment = { vertical: 'top' };
                    }

                    // Check if value is simple list
                    if (value.type === 'string' && value.enum)
                        cell.font = { ...excelStyle.cell.font, color: { argb: hexToARGB(template.enumPropertiesColors![key][row[key]]) } };

                    // Check if value is multiple list
                    if (value.type === 'array' && value.items?.type === 'string' && value.items.enum) cell.value = row[key].join(', ');
                }
            }
        });
    });
};

export { createWorkbook, createWorksheet, styleAWorksheet };
