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
    let type = excelConfig.propertyType[propertyTemplate.format ? propertyTemplate.format : propertyTemplate.type];

    if (type === propertyType.array && propertyTemplate.enum) {
        type = propertyType.enum;
    }
    if (propertyTemplate.uniqueItems) {
        type += `, ${excelConfig.unique}`;
    }

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

const cerateWorksheet = async (workbook: Excel.Workbook, template: IEntityTemplatePopulated, onlyColumns?: boolean) => {
    const worksheet = workbook.addWorksheet(template.displayName);
    const { properties } = template.properties;
    const sheetColumns: Partial<Excel.Column>[] = [];
    Object.entries(properties).forEach(([propertyKey, propertyTemplate], index) => {
        const type = TypesToHebrew(propertyTemplate);
        if (propertyTemplate.type === 'boolean') {
            for (let row = 2; row <= 100; row++) {
                worksheet.getCell(`${columnIndexToExcelColumn(index + 1)}${row}`).dataValidation = {
                    type: 'list',
                    allowBlank: true,
                    formulae: ['כן, לא'],
                    showErrorMessage: true,
                    errorTitle: 'אופציה לא תקינה',
                    error: 'בבקשה תבחר כן או לא',
                };
            }
        }

        sheetColumns.push({
            key: propertyKey,
            header: `${propertyTemplate.title}${onlyColumns ? `(${type})` : ''}`,
            width: 20,
        });
    });
    worksheet.columns = onlyColumns ? sheetColumns : sheetColumns.concat(excelConfig.excelDefaultColumns);
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
            // Check if value is date
            if (excelConfig.regexOfDateFormat.test(String(cell.value))) {
                const date = new Date(String(cell.value)).toLocaleString(excelConfig.DATE_LOCALES, {
                    timeZone: excelConfig.DATE_TIMEZONE,
                });
                cell.value = date;
            }
            // Check if value is html tags when format is text area
            if (excelConfig.regexOfTextAreaFormat.test(String(cell.value))) {
                cell.value = String(cell.value).replace(/<[^>]*>/g, '');
                cell.alignment = { vertical: 'top' };
            }
        });
    });
};

export { styleAWorksheet, cerateWorksheet, createWorkbook, fixComplexProperties };
