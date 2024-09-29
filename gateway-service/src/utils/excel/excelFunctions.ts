/* eslint-disable no-param-reassign */
import Excel from 'exceljs';
import { v4 as uuidv4 } from 'uuid';
import config from '../../config/index';
import { IEntity } from '../../externalServices/instanceService/interfaces/entities';
import {
    IEntitySingleProperty,
    IEntityTemplatePopulated,
    IMongoEntityTemplatePopulated,
} from '../../externalServices/templates/entityTemplateService';
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

const createWorksheet = async (workbook: Excel.Workbook, template: IMongoEntityTemplatePopulated, displayColumns: string[]) => {
    const worksheet = workbook.addWorksheet(template.displayName);
    const { properties } = template.properties;

    const allProperties = properties;
    Object.keys(allProperties).forEach((key) => {
        if (!displayColumns.includes(key)) delete allProperties[key];
    });

    const sheetColumns: Partial<Excel.Column>[] = [];
    Object.entries(allProperties).forEach(([propertyKey, propertyTemplate]) => {
        sheetColumns.push({ key: propertyKey, header: propertyTemplate.title, width: 20 });
    });

    const externalColumns = excelConfig.excelDefaultColumns.filter((externalColumn) => displayColumns.includes(externalColumn.key));
    worksheet.columns = sheetColumns.concat(externalColumns);
    return worksheet;
};

export const getFileName = (fileId: string) => {
    return fileId.slice(config.storageService.fileIdLength);
};

const fixComplexProperties = (
    cell: Excel.Cell,
    template: IEntityTemplatePopulated,
    row: Record<string, any>,
    [key, value]: [string, IEntitySingleProperty],
    relationshipRefColors: Record<string, string>,
    rowIndex: number,
    workspacePath: string,
) => {
    if (value.format === 'relationshipReference') {
        const { relatedTemplateId } = value.relationshipReference!;

        const colorTemplate = relationshipRefColors[relatedTemplateId];

        cell.value = {
            text: row[key].properties[value.relationshipReference!.relatedTemplateField],
            hyperlink: `${config.service.meltaBaseUrl}${workspacePath}/entity/${row[key].properties._id}`,
        };
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: hexToARGB(colorTemplate) },
        };
        return true;
    }
    if (value.format === 'fileId') {
        cell.value = {
            text: getFileName(row[key]),
            hyperlink: `${config.service.meltaBaseUrl}${workspacePath}/api/files/${encodeURIComponent(row[key])}`,
        };
        return true;
    }
    if (value?.items?.format === 'fileId') {
        const files = row[key].join('?');

        cell.value = {
            text: `attachmentZip${rowIndex}`,
            hyperlink: `${config.service.meltaBaseUrl}${workspacePath}/api/files/zip/${encodeURIComponent(files)}`,
        };
        return true;
    }
    if (value.type === 'array') {
        const list = row[key].flatMap((text: string, index: number) => (index < row[key].length - 1 ? [text, ', '] : [text]));

        cell.value = {
            richText: list.map((text: string) => ({
                text,
                font: {
                    ...excelStyle.cell,
                    color: { argb: text === ', ' ? 'FF000000' : hexToARGB(template.enumPropertiesColors![key][text]) },
                },
            })),
        };
        return true;
    }
    return false;
};

const styleAWorksheet = (
    worksheet: Excel.Worksheet,
    rows: IEntity['properties'][],
    template: IMongoEntityTemplatePopulated,
    relationshipRefColors: Record<string, string>,
    displayColumns: string[],
    workspacePath: string,
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
            const cell = worksheet.getCell(`${(columnIndex + 10).toString(36).toUpperCase()}${rowIndex + 2}`);
            if (row[key] !== undefined) {
                cell.alignment = excelStyle.cell.alignment;
                cell.font = excelStyle.cell.font;
                const isComplex = fixComplexProperties(cell, template, row, [key, value], relationshipRefColors, rowIndex, workspacePath);

                if (!isComplex) {
                    cell.value = row[key];
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
                }
            }
        });
    });
};

export { createWorkbook, createWorksheet, styleAWorksheet };
