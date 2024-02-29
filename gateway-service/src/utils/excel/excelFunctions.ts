/* eslint-disable no-param-reassign */
import Excel from 'exceljs';
import { v4 as uuidv4 } from 'uuid';
import { IEntityTemplatePopulated } from '../../externalServices/entityTemplateService';
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

const cerateWorksheet = async (workbook: Excel.Workbook, template: IEntityTemplatePopulated) => {
    const worksheet = workbook.addWorksheet(template.displayName);
    const { properties } = template.properties;
    const sheetColumns: Partial<Excel.Column>[] = [];
    Object.entries(properties).forEach(([propertyKey, propertyTemplate]) => {
        sheetColumns.push({ key: propertyKey, header: propertyTemplate.title, width: 20 });
    });
    worksheet.columns = sheetColumns.concat(excelConfig.excelDefaultColumns);
    return worksheet;
};

export const getFileName = (fileId: string) => {
    return fileId.slice(config.storageService.fileIdLength);
};

const fixFileProperties = (rows: IEntity['properties'][], template: IEntityTemplatePopulated) => {
    const { properties } = template.properties;
    Object.entries(properties).forEach(([key, value]) => {
        if (value.format === 'fileId') {
            rows.forEach((row) => {
                if (row[key]) {
                    row[key] = {
                        text: getFileName(row[key]),
                        hyperlink: `${config.storageService.fileHyperLink}/${encodeURIComponent(row[key])}`,
                    };
                }
            });
        } else if (value?.items?.format === 'fileId') {
            rows.forEach((row, index) => {
                if (row[key]) {
                    const files = row[key].join('?');
                    row[key] = {
                        text: `attachmentZip${index}`,
                        hyperlink: `${config.storageService.fileHyperLink}/zip/${encodeURIComponent(files)}`,
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
        });
    });
};

export { styleAWorksheet, cerateWorksheet, createWorkbook, fixFileProperties };
