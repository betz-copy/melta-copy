/* eslint-disable no-param-reassign */
import Excel from 'exceljs';
import { v4 as uuidv4 } from 'uuid';
import { IEntitySingleProperty, IMongoEntityTemplatePopulated } from '../../externalServices/templates/entityTemplateService';
import { IEntity } from '../../externalServices/instanceService/interfaces/entities';
import config from '../../config/index';
import { excelConfig } from './excelConfig';
import { hexToARGB } from './colors';

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

const TypesToHebrew = (propertyTemplate: IEntitySingleProperty) => {
    const { propertyType } = excelConfig;
    const type = excelConfig.propertyType[propertyTemplate.format ? propertyTemplate.format : propertyTemplate.type];

    if (type === propertyType.string) {
        if (propertyTemplate.enum) return propertyType.enum;
        if (propertyTemplate.pattern) return propertyType.pattern;
    }
    if (type === propertyType.array && propertyTemplate.items?.type === 'string') return propertyType.enumArray;

    return type;
};

const columnIndexToExcelColumn = (index: number): string => {
    let result = '';
    while (index > 0) {
        index--;
        result = String.fromCharCode((index % 26) + 65) + result;
        index = Math.floor(index / 26);
    }
    return result;
};

const columnDataValidation = (worksheet: Excel.Worksheet, propertyTemplate: IEntitySingleProperty, columnIndex: number) => {
    const { formulae } = excelConfig;
    if (propertyTemplate.type === 'boolean') {
        for (let row = 2; row <= 100; row++) {
            const allowedValues = formulae.boolean;
            worksheet.getCell(`${columnIndexToExcelColumn(columnIndex + 1)}${row}`).dataValidation = {
                type: 'list',
                allowBlank: true,
                formulae: [allowedValues],
                showErrorMessage: true,
                errorTitle: formulae.errorTitle,
                error: `${formulae.errorDescription} ${allowedValues}`,
            };
        }
    }
    if (propertyTemplate.type === 'number') {
        for (let row = 2; row <= 100; row++) {
            worksheet.getCell(`${columnIndexToExcelColumn(columnIndex + 1)}${row}`).dataValidation = {
                type: 'decimal',
                operator: 'between',
                formulae: ['-9999999999', '9999999999'],
                allowBlank: true,
                showErrorMessage: true,
                errorTitle: formulae.errorTitle,
                error: formulae.numberError,
            };
        }
    }
    if (propertyTemplate.type === 'string' && propertyTemplate.enum) {
        const allowedValues = propertyTemplate.enum.join(', ');

        for (let row = 2; row <= 100; row++) {
            worksheet.getCell(`${columnIndexToExcelColumn(columnIndex + 1)}${row}`).dataValidation = {
                type: 'list',
                allowBlank: true,
                formulae: [allowedValues],
                showErrorMessage: true,
                errorTitle: formulae.errorTitle,
                error: `${formulae.errorDescription} ${allowedValues}`,
            };
        }
    }
    // TODO: array list not working
    // if (propertyTemplate.type === 'array' && propertyTemplate.items?.type === 'string' && propertyTemplate.items.enum) {
    //     const allowedValues = propertyTemplate.items.enum.join(', ');

    //     for (let row = 2; row <= 100; row++) {
    //         worksheet.getCell(`${columnIndexToExcelColumn(columnIndex + 1)}${row}`).dataValidation = {
    //             type: 'list',
    //             allowBlank: true,
    //             formulae: [allowedValues],
    //             showErrorMessage: true,
    //             errorTitle: formulae.errorTitle,
    //             error: `${formulae.errorDescription} ${allowedValues}`,
    //         };
    //     }
    // }
};

const createWorksheet = async (
    workbook: Excel.Workbook,
    template: IMongoEntityTemplatePopulated,
    displayColumns?: string[],
    insertEntities?: { insert: boolean; entities?: Record<string, any>[] },
) => {
    const worksheet = workbook.addWorksheet(`${template.displayName}${template._id}`);
    const { properties } = template.properties;

    const sheetColumns: Partial<Excel.Column>[] = [];

    Object.entries(properties).forEach(([propertyKey, propertyTemplate], index) => {
        const isRelationshipRef = propertyTemplate.format === 'relationshipReference' || propertyTemplate.relationshipReference;
        const isFile = propertyTemplate.format === 'fileId' || (propertyTemplate.type === 'array' && propertyTemplate.items?.format === 'fileId');
        const shouldAddColumn = displayColumns?.includes(propertyKey) && insertEntities?.insert ? !isRelationshipRef && !isFile : true;

        if (shouldAddColumn) {
            const type = TypesToHebrew(propertyTemplate);
            columnDataValidation(worksheet, propertyTemplate, index);

            sheetColumns.push({
                key: propertyKey,
                header: `${propertyTemplate.title}${insertEntities?.insert ? `(${type})` : ''}`,
                width: 20,
            });
        }
    });

    const externalColumns = excelConfig.excelDefaultColumns.filter((externalColumn) => displayColumns?.includes(externalColumn.key));
    worksheet.columns = insertEntities?.insert ? sheetColumns : sheetColumns.concat(externalColumns);
    worksheet.getRow(1).eachCell((cell) => {
        cell.font = excelStyle.columnHeader.font;
        cell.alignment = excelStyle.columnHeader.alignment;
    });
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

const styleAWorksheet = (
    worksheet: Excel.Worksheet,
    rows: IEntity['properties'][],
    template: IMongoEntityTemplatePopulated,
    workspace: { path: string; id: string },
    displayColumns?: string[],
) => {
    worksheet.getRow(1).eachCell((cell) => {
        cell.font = excelStyle.columnHeader.font;
        cell.alignment = excelStyle.columnHeader.alignment;
    });
    const { properties } = template.properties;
    const { createdAt, updatedAt, disabled } = template;

    const allProperties: Record<string, any> = Object.entries({ ...properties, disabled, createdAt, updatedAt })
        .filter(([key]) => displayColumns?.includes(key))
        .reduce((acc, [key, value]) => {
            acc[key] = value;
            return acc;
        }, {});

    Object.entries(allProperties).forEach(([key, value], columnIndex) => {
        rows.forEach((row, rowIndex) => {
            const cell = worksheet.getCell(`${columnIndexToExcelColumn(columnIndex + 1)}${rowIndex + 2}`);
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

export { createWorkbook, createWorksheet, styleAWorksheet, fixComplexProperties };
