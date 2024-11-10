/* eslint-disable no-param-reassign */
import Excel from 'exceljs';
import { v4 as uuidv4 } from 'uuid';
import { IEntitySingleProperty, IEntityTemplatePopulated } from '../../externalServices/templates/entityTemplateService';
import { IEntity } from '../../externalServices/instanceService/interfaces/entities';
import config from '../../config/index';
import { excelConfig } from './excelConfig';

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

const cerateWorksheet = async (
    workbook: Excel.Workbook,
    template: IEntityTemplatePopulated,
    insertEntities?: { insert: boolean; entities?: Record<string, any>[] },
) => {
    const worksheet = workbook.addWorksheet(template.displayName);
    const { properties } = template.properties;
    const sheetColumns: Partial<Excel.Column>[] = [];
    Object.entries(properties).forEach(([propertyKey, propertyTemplate], index) => {
        const isRelationshipRef = propertyTemplate.format === 'relationshipReference' || propertyTemplate.relationshipReference;
        const isFile = propertyTemplate.format === 'fileId' || (propertyTemplate.type === 'array' && propertyTemplate.items?.format === 'fileId');
        const shouldAddColumn = insertEntities?.insert ? !isRelationshipRef && !isFile : true;

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
    worksheet.columns = insertEntities?.insert ? sheetColumns : sheetColumns.concat(excelConfig.excelDefaultColumns);
    worksheet.getRow(1).eachCell((cell) => {
        cell.font = excelStyle.columnHeader.font;
        cell.alignment = excelStyle.columnHeader.alignment;
    });
    return worksheet;
};

export const getFileName = (fileId: string) => {
    return fileId.slice(config.storageService.fileIdLength);
};

const fixComplexProperties = (rows: IEntity['properties'][], template: IEntityTemplatePopulated) => {
    const { properties } = template.properties;
    Object.entries(properties).forEach(([key, value]) => {
        if (value.format === 'relationshipReference') {
            rows.forEach((row) => {
                if (row[key] && row[key].properties) {
                    row[key] = {
                        text: row[key].properties[value.relationshipReference!.relatedTemplateField],
                        hyperlink: `${config.service.meltaBaseUrl}/entity/${row[key].properties._id}`,
                    };
                }
            });
        } else if (value.format === 'fileId') {
            rows.forEach((row) => {
                if (row[key]) {
                    row[key] = {
                        text: getFileName(row[key]),
                        hyperlink: `${config.service.meltaBaseUrl}/api/files/${encodeURIComponent(row[key])}`,
                    };
                }
            });
        } else if (value?.items?.format === 'fileId') {
            rows.forEach((row, index) => {
                if (row[key]) {
                    const files = row[key].join('?');
                    row[key] = {
                        text: `attachmentZip${index}`,
                        hyperlink: `${config.service.meltaBaseUrl}/api/files/zip/${encodeURIComponent(files)}`,
                    };
                }
            });
        }
    });

    return rows;
};

const styleAWorksheet = (worksheet: Excel.Worksheet) => {
    worksheet.eachColumnKey((col: Excel.Column) => {
        col.eachCell({ includeEmpty: true }, (cell) => {
            cell.font = excelStyle.cell.font;
            cell.alignment = excelStyle.cell.alignment;
            if (Number(cell.row) === 1) {
                cell.font = excelStyle.columnHeader.font;
                cell.alignment = excelStyle.columnHeader.alignment;
            }
            if (typeof cell.value === 'boolean') {
                cell.value = cell.value ? excelConfig.TRUE_TO_HEBREW : excelConfig.FALSE_TO_HEBREW;
            }
            if (excelConfig.regexOfDateFormat.test(String(cell.value))) {
                const date = new Date(String(cell.value)).toLocaleString(excelConfig.DATE_LOCALES, {
                    timeZone: excelConfig.DATE_TIMEZONE,
                });
                cell.value = date;
            }
            if (excelConfig.regexOfTextAreaFormat.test(String(cell.value))) {
                cell.value = String(cell.value).replace(/<[^>]*>/g, '');
                cell.alignment = { vertical: 'top' };
            }
        });
    });
};

export { styleAWorksheet, cerateWorksheet, createWorkbook, fixComplexProperties };
