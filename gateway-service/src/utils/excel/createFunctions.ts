/* eslint-disable no-param-reassign */
import {
    CoordinateSystem,
    EntityTemplateType,
    IEntity,
    IEntitySingleProperty,
    IEnumPropertiesColors,
    IMongoEntityTemplatePopulated,
    locationConverterToString,
    TemplateItem,
} from '@microservices/shared';
import Excel, { Cell } from 'exceljs';
import { v4 as uuidv4 } from 'uuid';
import config from '../../config/index';
import hexToARGB from './colors';
import excelConfig from './excelConfig';
import { isIncludedColumn, isIncludedEditColumn } from './getFunctions';

const {
    formats: { dateTime, date: dateFormat },
    excel: { or, and },
} = config;

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

const TypesToHebrew = (
    propertyTemplate: IEntitySingleProperty,
    relatedTemplatesMap: Record<string, IMongoEntityTemplatePopulated>,
    unitsMap: Map<string, string>,
    isLoadMode?: boolean,
) => {
    const { propertyType } = excelConfig;
    const type = propertyType[propertyTemplate.format ?? propertyTemplate.type];

    if (propertyTemplate.format === 'unitField') return `${propertyType.unitField}: ${[...unitsMap.values()].join(or)}`;

    if (type === propertyType.string) {
        if (propertyTemplate.enum) return `${propertyType.enum}: ${propertyTemplate.enum.join(or)}`;
        if (propertyTemplate.pattern) return `${propertyType.regex}`;
    }
    if (type === propertyType.array && propertyTemplate.items) {
        if (propertyTemplate.items.format === 'user') return propertyType.users;
        if (propertyTemplate.items.format === 'fileId') return propertyType.files;
        return `${propertyType.multiEnum}: ${propertyTemplate.items.enum?.join(and)}`;
    }

    if (type === propertyType.relationshipReference && isLoadMode) {
        if (propertyTemplate.relationshipReference?.relatedTemplateId) {
            const relatedTemplate = relatedTemplatesMap[propertyTemplate.relationshipReference.relatedTemplateId];
            const identifierFieldTitle = Object.values(relatedTemplate.properties.properties).find((value) => value.identifier)?.title;

            return `${type} ${relatedTemplate?.displayName} ${identifierFieldTitle ? `- ${identifierFieldTitle}` : ''}`;
        }
    }
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

export const showRelationshipRefColumn = (
    propertyKey: string,
    propertyTemplate: IEntitySingleProperty,
    relatedTemplatesMap: Record<string, IMongoEntityTemplatePopulated>,
    requiredConstraints: string[],
) => {
    if (propertyTemplate.format !== 'relationshipReference') return true;

    const relatedTemplateId = propertyTemplate.relationshipReference?.relatedTemplateId;
    const relatedTemplate = relatedTemplatesMap[relatedTemplateId!];

    if (!relatedTemplate) return false;

    const identifierField = Object.entries(relatedTemplate?.properties.properties).find(([_key, value]) => value.identifier)?.[0];
    const isRequiredProperty = requiredConstraints?.includes(propertyKey);

    return !!(identifierField || isRequiredProperty);
};

const createWorksheet = async (
    workbook: Excel.Workbook,
    templateItem: TemplateItem,
    relatedTemplatesMap: Record<string, IMongoEntityTemplatePopulated>,
    requiredConstraints: string[],
    unitsMap: Map<string, string>,
    displayColumns?: string[],
    isLoadMode?: boolean,
) => {
    const { metaData: template } = templateItem;

    const worksheet = workbook.addWorksheet(template.displayName);

    const sheetColumns: Partial<Excel.Column>[] = [];
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    let columnIndex = 0; // TODO: make data validation work in office excel

    Object.entries(template.properties.properties).forEach(([propertyKey, propertyTemplate]) => {
        const shouldAddColumn = isLoadMode
            ? showRelationshipRefColumn(propertyKey, propertyTemplate, relatedTemplatesMap, requiredConstraints) && isIncludedColumn(propertyTemplate)
            : displayColumns?.includes(propertyKey);

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

    worksheet.columns = isLoadMode ? sheetColumns : sheetColumns.concat(externalColumns);
    worksheet.getRow(1).eachCell((cell) => {
        cell.font = excelStyle.columnHeader.font;
        cell.alignment = excelStyle.columnHeader.alignment;

        const type =
            externalColumns.find(({ header }) => header === cell.value)?.header ??
            TypesToHebrew(
                Object.values(template.properties.properties).find((propertyTemplate) => propertyTemplate.title === cell.value)!,
                relatedTemplatesMap,
                unitsMap,
                isLoadMode,
            );

        cell.note = type;
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFA7C7E7' },
        };
    });
    return worksheet;
};

export const getFileName = (fileId: string) => fileId.slice(config.storageService.fileIdLength);

const relationshipRefCell = (
    cell: Excel.Cell,
    [key, value]: [string, IEntitySingleProperty],
    row: Record<string, any>,
    workspacePath: string,
    unitsMap: Map<string, string>,
    relatedTemplatesMap: Record<string, IMongoEntityTemplatePopulated>,
    enumPropertiesColors?: IEnumPropertiesColors,
    insertEntities?: boolean,
    headersOnly?: boolean,
) => {
    if (insertEntities) {
        cell.value = row[key];
        return;
    }

    const relatedTemplate = relatedTemplatesMap[value.relationshipReference!.relatedTemplateId!];
    const relatedTemplateField = value.relationshipReference!.relatedTemplateField;
    const relatedTemplateProperty = relatedTemplate.properties.properties[value.relationshipReference!.relatedTemplateField];

    const formatted = formatCellValue(
        row[key].properties[relatedTemplateField],
        key,
        relatedTemplateProperty,
        unitsMap,
        enumPropertiesColors,
        insertEntities,
        headersOnly,
    );

    cell.value = {
        text: formatted.value == null ? '' : String(formatted.value),
        hyperlink: `${config.service.meltaBaseUrl}${workspacePath}/entity/${row[key].properties._id}`,
    };
};

const userArrayCell = (cell: Excel.Cell, row: Record<string, any>, key: string, insertEntities?: boolean) => {
    const currentValue = row[key];
    cell.value = insertEntities
        ? Array.isArray(currentValue)
            ? currentValue.join(and)
            : currentValue
        : currentValue.map((stringUser) => JSON.parse(stringUser).fullName).join(and);
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
    unitsMap: Map<string, string>,
    relatedTemplatesMap: Record<string, IMongoEntityTemplatePopulated>,
    enumPropertiesColors?: IEnumPropertiesColors,
    insertEntities?: boolean,
    headersOnly?: boolean,
) => {
    const isFileArray = value.type === 'array' && value.items?.format === 'fileId';
    const isSingleFile = value.format === 'fileId';
    const isSignature = value.format === 'signature';
    const isUserArray = value.type === 'array' && value.items?.format === 'user';

    if (value.format === 'relationshipReference') {
        relationshipRefCell(
            cell,
            [key, value],
            row,
            workspace.path,
            unitsMap,
            relatedTemplatesMap,
            enumPropertiesColors,
            insertEntities,
            headersOnly,
        );
        return true;
    }

    if (isSingleFile || isFileArray || isSignature) {
        filesCell(cell, isFileArray, rowIndex, row[key], workspace.id);
        return true;
    }

    if (isUserArray) {
        userArrayCell(cell, row, key, insertEntities);
        return true;
    }

    return false;
};

const readOnlyCell = (cell: Cell) => {
    cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD3D3D3' },
    };
};

type FormattedCell = {
    value: any;
    numFmt?: string;
    alignment?: Excel.Alignment;
    font?: Partial<Excel.Font>;
};

const formatCellValue = (
    rawValue: any,
    key: string,
    property: IEntitySingleProperty,
    unitsMap: Map<string, string>,
    enumPropertiesColors?: IEnumPropertiesColors,
    insertEntities?: boolean,
    headersOnly?: boolean,
): FormattedCell => {
    let numFmt: string | undefined;
    let alignment: Excel.Alignment | undefined;
    let font: Partial<Excel.Font> | undefined;

    if (typeof rawValue === 'boolean') rawValue = rawValue ? excelConfig.TRUE_TO_HEBREW : excelConfig.FALSE_TO_HEBREW;

    if (property.format === 'user') rawValue = insertEntities ? rawValue : JSON.parse(rawValue as string)?.fullName;

    if (property.format === 'location') {
        if (typeof rawValue === 'string' && rawValue.includes('{')) {
            const location = typeof rawValue === 'string' ? JSON.parse(rawValue) : rawValue;

            rawValue =
                location.coordinateSystem === CoordinateSystem.UTM
                    ? locationConverterToString(location.location, CoordinateSystem.WGS84, CoordinateSystem.UTM)
                    : location.location;
        }
    }

    if (property.format === 'unitField') rawValue = unitsMap.get(rawValue as string);

    //  date formatting
    if (rawValue && typeof rawValue === 'string') {
        const str = String(rawValue);

        if (excelConfig.regexOfDateFormat.test(str)) {
            const date = new Date(str);

            if (str.includes(':')) {
                rawValue = date;
                numFmt = dateTime;
            } else {
                rawValue = new Date(date.setHours(0, 0, 0, 0));
                numFmt = dateFormat;
            }
        }
    }

    // text-area (strip html)
    if (excelConfig.regexOfTextAreaFormat.test(String(rawValue))) {
        rawValue = String(rawValue).replace(/<[^>]*>/g, '');
        alignment = { vertical: 'top' } as Excel.Alignment;
    }

    if (property.type === 'number') rawValue = rawValue.toString();

    // enum simple list
    if (!headersOnly && property.type === 'string' && property.enum) {
        const color = enumPropertiesColors?.[key]?.[rawValue];

        if (color) font = { ...excelStyle.cell.font, color: { argb: hexToARGB(color) } };
    }

    // enum multiple list
    if (!headersOnly && property.type === 'array' && property.items?.type === 'string' && property.items.enum) rawValue = rawValue.join(', ');

    return { value: rawValue, numFmt, alignment, font };
};

const styleAWorksheet = (
    worksheet: Excel.Worksheet,
    rows: IEntity['properties'][],
    templateItem: TemplateItem,
    workspace: { path: string; id: string },
    unitsMap: Map<string, string>,
    relatedTemplatesMap: Record<string, IMongoEntityTemplatePopulated>,
    displayColumns?: string[],
    headersOnly?: boolean,
    insertEntities?: boolean,
    skip: number = 0,
) => {
    const { type, metaData: template } = templateItem;
    const parentTemplate = type === EntityTemplateType.Child ? template.parentTemplate : template;

    worksheet.getRow(1).eachCell((cell) => {
        cell.font = excelStyle.columnHeader.font;
        cell.alignment = excelStyle.columnHeader.alignment;
    });

    const { disabled, createdAt, updatedAt } = template;

    const allProperties: Record<string, IEntitySingleProperty> = Object.entries({ ...template.properties.properties, disabled, createdAt, updatedAt })
        .filter(([key]) => displayColumns?.includes(key))
        .reduce((acc, [key, value]) => {
            acc[key] = value;
            return acc;
        }, {});

    Object.entries(allProperties).forEach(([key, value], columnIndex) => {
        rows.forEach((row, index) => {
            const rowIndex = index + skip;
            const cell = worksheet.getCell(`${indexToExcelColumn(columnIndex + 1)}${rowIndex + SKIP_ROW_HEADER}`);

            if (!isIncludedEditColumn(value, row.disabled, disabled)) readOnlyCell(cell);

            if (row[key] !== undefined && value !== undefined) {
                cell.alignment = excelStyle.cell.alignment;
                cell.font = excelStyle.cell.font;

                const isComplex = fixComplexProperties(
                    cell,
                    row,
                    [key, value],
                    rowIndex,
                    workspace,
                    unitsMap,
                    relatedTemplatesMap,
                    parentTemplate.enumPropertiesColors,
                    insertEntities,
                    headersOnly,
                );
                if (!isComplex) {
                    cell.value = row[key];

                    const {
                        value: formattedCellValue,
                        alignment,
                        font,
                        numFmt,
                    } = formatCellValue(row[key], key, value, unitsMap, parentTemplate.enumPropertiesColors, insertEntities, headersOnly);

                    Object.assign(cell, {
                        value: formattedCellValue,
                        ...(numFmt && { numFmt }),
                        ...(alignment && { alignment }),
                        ...(font && { font }),
                    });
                }
            }
        });
    });

    Object.entries(allProperties).forEach(([_key, value], columnIndex) => {
        if (value.archive) worksheet.getColumn(columnIndex + 1).hidden = true;
    });
};

export { createWorkbook, createWorksheet, styleAWorksheet };
