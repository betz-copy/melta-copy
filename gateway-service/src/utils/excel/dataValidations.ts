import { IEntitySingleProperty } from '@packages/entity-template';
import Excel from 'exceljs';
import config from '../../config';
import { indexToExcelColumn } from './createFunctions';
import excelConfig from './excelConfig';

const { maxValidationRow, minValidationRow } = config.loadExcel;

export const booleanValidation = (worksheet: Excel.Worksheet, columnIndex: number) => {
    const { formulae } = excelConfig;

    for (let row = minValidationRow; row <= maxValidationRow; row++) {
        const allowedValues = formulae.boolean;
        const cell = worksheet.getCell(`${indexToExcelColumn(columnIndex + 1)}${row}`);
        cell.dataValidation = {
            type: 'list',
            formulae: [allowedValues],
            allowBlank: true,
            showErrorMessage: true,
            errorTitle: formulae.errorTitle,
            error: `${formulae.errorDescription} ${allowedValues}`,
        };
    }
};

export const numberValidation = (worksheet: Excel.Worksheet, columnIndex: number) => {
    const { formulae } = excelConfig;

    for (let row = minValidationRow; row <= maxValidationRow; row++) {
        const cell = worksheet.getCell(`${indexToExcelColumn(columnIndex + 1)}${row}`);
        cell.dataValidation = {
            type: 'decimal',
            operator: 'between',
            formulae: [Number.MIN_VALUE, Number.MAX_VALUE],
            allowBlank: true,
            showErrorMessage: true,
            errorTitle: formulae.errorTitle,
            error: formulae.numberError,
        };
    }
};

export const listValidation = (worksheet: Excel.Worksheet, propertyTemplate: IEntitySingleProperty, columnIndex: number) => {
    const { formulae } = excelConfig;
    const allowedValues = propertyTemplate.enum!.join(', ');

    for (let row = minValidationRow; row <= maxValidationRow; row++) {
        const cell = worksheet.getCell(`${indexToExcelColumn(columnIndex + 1)}${row}`);
        cell.dataValidation = {
            type: 'list',
            formulae: [allowedValues],
            allowBlank: true,
            showErrorMessage: true,
            errorTitle: formulae.errorTitle,
            error: `${formulae.errorDescription} ${allowedValues}`,
        };
    }
};

export const dateValidation = (worksheet: Excel.Worksheet, columnIndex: number) => {
    const { formulae } = excelConfig;

    for (let row = minValidationRow; row <= maxValidationRow; row++) {
        const cell = worksheet.getCell(`${indexToExcelColumn(columnIndex + 1)}${row}`);
        cell.dataValidation = {
            type: 'date',
            operator: 'greaterThan',
            formulae: [new Date(1800, 1, 1)],
            allowBlank: true,
            showErrorMessage: true,
            errorTitle: formulae.errorTitle,
            error: formulae.dateError,
        };
        cell.numFmt = 'mm/dd/yyyy';
    }
};

export const mailValidation = (worksheet: Excel.Worksheet, columnIndex: number) => {
    const { formulae } = excelConfig;

    for (let row = minValidationRow; row <= maxValidationRow; row++) {
        const cell = worksheet.getCell(`${indexToExcelColumn(columnIndex + 1)}${row}`);
        cell.dataValidation = {
            type: 'custom',
            formulae: [`ISNUMBER(SEARCH("@", ${indexToExcelColumn(columnIndex + 1)}${row}))`],
            allowBlank: true,
            showErrorMessage: true,
            errorTitle: formulae.errorTitle,
            error: formulae.mailError,
        };
    }
};
