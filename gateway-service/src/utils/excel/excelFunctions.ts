import { IEntity, IEntitySingleProperty, IMongoEntityTemplatePopulated } from '@microservices/shared';
import Excel from 'exceljs';
import { v4 as uuidv4 } from 'uuid';
import config from '../../config/index';
import hexToARGB from './colors';
import excelConfig from './excelConfig';
import { isIncludedColumn } from './getFunctions';

const { dateTime, date: dateFormat } = config.formats;

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

const SKIP_ROW_HEADER = 2;

const createWorkbook = async (fileName: string) => {
    const name = fileName.replace(/\//g, '');

    const fileOption = {
        filename: `${config.service.excelFilePath}/${uuidv4()}${name}`,
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
        if (propertyTemplate.enum) return `${propertyType.enum}: ${propertyTemplate.enum.join('/ ')}`;
        if (propertyTemplate.pattern) return `${propertyType.regex}`;
    }
    if (type === propertyType.array && propertyTemplate.items?.type === 'string')
        return `${propertyType.multiEnum}: ${propertyTemplate.items.enum?.join(', ')}`;

    return type;
};

export const indexToExcelColumn = (index: number): string => {
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

// TODO: make data validation work in office excel
// const columnDataValidation = (worksheet: Excel.Worksheet, propertyTemplate: IEntitySingleProperty, columnIndex: number) => {
//     switch (propertyTemplate.type) {
//         case 'boolean':
//             booleanValidation(worksheet, columnIndex);
//             break;
//         case 'number':
//             numberValidation(worksheet, columnIndex);
//             break;
//         default:
//             break;
//     }

//     if (propertyTemplate.type === 'string' && propertyTemplate.enum) listValidation(worksheet, propertyTemplate, columnIndex);

//     switch (propertyTemplate.format) {
//         case 'date':
//             dateValidation(worksheet, columnIndex);
//             break;
//         case 'email':
//             mailValidation(worksheet, columnIndex);
//             break;
//         default:
//             break;
//     }
// };

const createWorksheet = async (
    workbook: Excel.Workbook,
    template: IMongoEntityTemplatePopulated,
    displayColumns?: string[],
    headersOnly?: boolean,
) => {
    const worksheet = workbook.addWorksheet(template.displayName);
    const { properties } = template.properties;

    const sheetColumns: Partial<Excel.Column>[] = [];
    let columnIndex = 0; // TODO: make data validation work in office excel

    Object.entries(properties).forEach(([propertyKey, propertyTemplate]) => {
        const shouldAddColumn = headersOnly ? isIncludedColumn(propertyTemplate) : displayColumns?.includes(propertyKey);

        if (shouldAddColumn) {
            // TODO: make data validation work in office excel
            // columnDataValidation(worksheet, propertyTemplate, columnIndex);
            columnIndex++;
            sheetColumns.push({
                key: propertyKey,
                header: propertyTemplate.title,
                width: 20,
            });
        }
    });
    const externalColumns = excelConfig.excelDefaultColumns.filter((externalColumn) => displayColumns?.includes(externalColumn.key));
    worksheet.columns = headersOnly ? sheetColumns : sheetColumns.concat(externalColumns);
    worksheet.getRow(1).eachCell((cell) => {
        cell.font = excelStyle.columnHeader.font;
        cell.alignment = excelStyle.columnHeader.alignment;
        if (headersOnly) {
            const type = TypesToHebrew(Object.values(properties).find((propertyTemplate) => propertyTemplate.title === cell.value)!);
            cell.note = type;
        }
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
    headersOnly?: boolean,
    skip: number = 0,
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
        rows.forEach((row, index) => {
            const rowIndex = index + skip;
            const cell = worksheet.getCell(`${indexToExcelColumn(columnIndex + 1)}${rowIndex + SKIP_ROW_HEADER}`);
            if (row[key] !== undefined && value !== undefined) {
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
                                cell.numFmt = dateTime;
                            } else {
                                cell.value = new Date(date.setHours(0, 0, 0, 0));
                                cell.numFmt = dateFormat;
                            }
                        }
                    }
                    // Check if value is html tags when format is text area
                    if (excelConfig.regexOfTextAreaFormat.test(String(cell.value))) {
                        cell.value = String(cell.value).replace(/<[^>]*>/g, '');
                        cell.alignment = { vertical: 'top' };
                    }

                    // Check if value is simple list
                    if (!headersOnly)
                        if (value.type === 'string' && value.enum) {
                            if (template?.enumPropertiesColors?.[key]?.[row?.[key]])
                                cell.font = { ...excelStyle.cell.font, color: { argb: hexToARGB(template.enumPropertiesColors[key][row[key]]) } };
                        }

                    // Check if value is multiple list
                    if (!headersOnly)
                        if (value.type === 'array' && value.items?.type === 'string' && value.items.enum) cell.value = row[key].join(', ');
                }
            }
        });
    });
};

export { createWorkbook, createWorksheet, fixComplexProperties, styleAWorksheet };
