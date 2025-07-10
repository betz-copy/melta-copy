import {
    ColDef,
    ICellRendererParams,
    IDateFilterParams,
    ISetFilterParams,
    ValueFormatterParams,
    ValueGetterFunc,
    ValueGetterParams,
} from '@ag-grid-community/core';
import { PriorityHigh } from '@mui/icons-material';
import { Box, Grid, Tooltip, tooltipClasses } from '@mui/material';
import Chip from '@mui/material/Chip';
import i18next from 'i18next';
import React from 'react';
import OpenPreview from '../../common/FilePreview/OpenPreview';
import { MeltaTooltip } from '../../common/MeltaTooltip';
import RelationshipReferenceView from '../../common/RelationshipReferenceView';
import UserAvatar from '../../common/UserAvatar';
import { EntityData, IEntity, IRequiredConstraint, IUniqueConstraint } from '../../interfaces/entities';
import { IEntitySingleProperty, IEntityTemplateMap, IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import { IError, IFailedEntity, IValidationError } from '../../interfaces/excel';
import { ActionErrors } from '../../interfaces/ruleBreaches/actionMetadata';
import { ISemanticSearchResult } from '../../interfaces/semanticSearch';
import { IUser } from '../../interfaces/users';
import OpenMap from '../../pages/Map/OpenMap';
import { getDateWithoutTime, getLongDate } from '../date';
import { getFileName } from '../getFileName';
import { convertToPlainText } from '../HtmlTagsStringValue';
import { agGridLocaleText } from './agGridLocaleText';
import DateTimeCellEditor from './DateTimeCellEditor';
import OverflowWrapper from './OverflowWrapper';
import RelationshipRefCellEditor from './RelationshipRefCellEditor';
import SelectCellEditor from './SelectCellEditor';
import { Value } from './Value';
import { IMongoChildTemplatePopulated } from '../../interfaces/childTemplates';

const hasErrors = (data: any): data is IFailedEntity => {
    return data && Array.isArray(data.errors) && data.errors.every((error) => 'type' in error && 'metadata' in error);
};

const isPropertyInvalid = <Data extends any = EntityData>(
    props: ICellRendererParams<Data, any | undefined>,
    property: string,
    ignoreType = false,
) => {
    if (!ignoreType || !hasErrors(props.data)) return undefined;

    return props.data.errors.find((error) => {
        switch (error.type) {
            case ActionErrors.required:
                return (error.metadata as IRequiredConstraint).property === property;
            case ActionErrors.unique:
                return (error.metadata as IUniqueConstraint).properties.some((errorProperty) => errorProperty === property);
            case ActionErrors.validation: {
                return (error.metadata as IValidationError).path.slice(1).includes(property);
            }
            default:
                break;
        }
        return undefined;
    });
};

const errorColDef = <Data extends any = EntityData>(
    props: ICellRendererParams<Data, any | undefined>,
    error: IError,
    value: Partial<IEntitySingleProperty>,
) => {
    let message = '';
    switch (error.type) {
        case ActionErrors.required:
            message = i18next.t('wizard.entity.loadEntities.required');
            break;
        case ActionErrors.unique:
            message = i18next.t('wizard.entity.someEntityAlreadyHasTheSameField');
            break;
        case ActionErrors.validation: {
            const metadata = error.metadata as IValidationError;
            if (value.patternCustomErrorMessage) message = value.patternCustomErrorMessage;
            else if (metadata.message.includes('FilterValidationError')) {
                message = i18next.t('validation.notMatchingToFilter');
            } else if (metadata.message.includes('must')) {
                const allowedValues = metadata.params.allowedValues?.join(', ');
                const typeDescription = i18next.t(`propertyTypes.${value.format ?? value.type}`);
                message = `${i18next.t('wizard.entity.loadEntities.notValid')} ${allowedValues || typeDescription}`;
            } else message = metadata.message;
            break;
        }
        default:
            break;
    }

    return (
        <Box display="flex" justifyContent="center" alignItems="center" gap={1} width="100%">
            <Value hideValue={false} value={props.value ?? i18next.t('validation.required')} color="#A40000" />
            <Tooltip
                title={message}
                placement="top"
                arrow
                PopperProps={{
                    sx: {
                        [`& .${tooltipClasses.tooltip}`]: {
                            fontSize: '1rem',
                            backgroundColor: 'white',
                            borderRadius: '10px',
                            marginLeft: '5px',
                            color: '#A40000',
                            fontWeight: 400,
                            boxShadow: '0px 2.05px 6.16px 0px #00000040',
                        },
                        '& .MuiTooltip-arrow': {
                            color: 'white',
                        },
                    },
                }}
            >
                <PriorityHigh color="error" fontSize="small" />
            </Tooltip>
        </Box>
    );
};

export const numberColDef = <Data extends any = EntityData>(
    field: string,
    valueGetter: ValueGetterFunc<Data>,
    value: Partial<IEntitySingleProperty>,
    hardcodedWidth: number | undefined,
    isLastColumn: boolean,
    hideColumn = false,
    hideValue = false,
    ignoreType = false,
    searchValue: string | undefined = undefined,
    editable: (data: any) => boolean = () => false,
): ColDef => {
    return {
        field,
        headerName: value.title,
        valueGetter,
        filter: 'agNumberColumnFilter',
        cellRenderer: (props: ICellRendererParams<Data, number | undefined>) => {
            const error = isPropertyInvalid(props, field, ignoreType);
            if (error) return errorColDef(props, error, value);
            return <Value hideValue={hideValue} value={props.value?.toString() ?? ''} isNumberField={!ignoreType} searchValue={searchValue} />;
        },
        width: hardcodedWidth,
        flex: isLastColumn ? 1 : 0,
        hide: hideColumn,
        editable: (params) => (editable(params.data) ?? false) && value.serialStarter === undefined,
        cellEditor: 'agNumberCellEditor',
        cellEditorParams: {
            precision: 2,
            step: 1,
            showStepperButtons: true,
        },
    };
};

export const regexColDef = <Data extends any = EntityData>(
    field: string,
    valueGetter: ValueGetterFunc<Data>,
    value: Partial<IEntitySingleProperty>,
    hardcodedWidth: number | undefined,
    isLastColumn: boolean,
    hideColumn = false,
    hideValue = false,
    ignoreType = false,
    searchValue: string | undefined = undefined,
    editable: (data: any) => boolean = () => false,
): ColDef => {
    return {
        field,
        headerName: value.title,
        cellRenderer: (props: ICellRendererParams<Data, string | undefined>) => {
            const error = isPropertyInvalid(props, field, ignoreType);
            if (error) return errorColDef(props, error, value);
            return <Value hideValue={hideValue} value={props.value ?? ''} searchValue={searchValue} />;
        },
        valueGetter,
        filter: 'agTextColumnFilter',
        width: hardcodedWidth,
        flex: isLastColumn ? 1 : 0,
        hide: hideColumn,
        cellStyle: { direction: 'ltr' },
        editable: (params) => editable(params.data) ?? false,
        cellEditor: 'agTextCellEditor',
    };
};

export const stringColDef = <Data extends any = EntityData>(
    field: string,
    valueGetter: ValueGetterFunc<Data>,
    value: Partial<IEntitySingleProperty>,
    hardcodedWidth: number | undefined,
    isLastColumn: boolean,
    hideColumn = false,
    hideValue = false,
    ignoreType = false,
    searchValue: string | undefined = undefined,
    editable: (data: any) => boolean = () => false,
): ColDef => {
    return {
        field,
        headerName: value.title,
        cellRenderer: (props: ICellRendererParams<Data, string | undefined>) => {
            const error = isPropertyInvalid(props, field, ignoreType);
            if (error) return errorColDef(props, error, value);
            return <Value hideValue={hideValue} value={props.value?.toString() ?? ''} searchValue={searchValue} />;
        },
        valueGetter,
        filter: 'agTextColumnFilter',
        width: hardcodedWidth,
        flex: isLastColumn ? 1 : 0,
        hide: hideColumn,
        editable: (params) => editable(params.data) ?? false,
        cellEditor: value.format === 'text-area' ? 'agLargeTextCellEditor' : 'agTextCellEditor',
        cellEditorParams: (params) => ({
            ...params,
            value: convertToPlainText(params.value),
        }),
        cellEditorPopup: value.format === 'text-area',
    };
};

export const fileColDef = <Data extends any = EntityData>(
    field: string,
    valueGetter: ValueGetterFunc<Data>,
    value: { title: string },
    hardcodedWidth: number | undefined,
    isLastColumn: boolean,
    hideColumn = false,
    searchValue: string | undefined = undefined,
    entityFileIdsWithTexts: ISemanticSearchResult[string][string] | undefined = undefined,
): ColDef => {
    return {
        field,
        headerName: value.title,
        valueGetter,
        cellRenderer: (props: ICellRendererParams<Data, string | undefined>) =>
            props.value?.toString() ? (
                <OpenPreview fileId={props.value?.toString()} searchValue={searchValue} entityFileIdsWithTexts={entityFileIdsWithTexts} />
            ) : null,
        filter: 'agTextColumnFilter',
        width: hardcodedWidth,
        flex: isLastColumn ? 1 : 0,
        hide: hideColumn,
    };
};

export const locationColDef = <Data extends any = EntityData>(
    field: string,
    valueGetter: ValueGetterFunc<Data>,
    entityGetter: ValueGetterFunc<any, any>,
    value: Partial<IEntitySingleProperty>,
    template: IMongoEntityTemplatePopulated | IMongoChildTemplatePopulated,
    hardcodedWidth: number | undefined,
    isLastColumn: boolean,
    hideColumn = false,
    ignoreType = false,
    searchValue: string | undefined = undefined,
): ColDef => {
    return {
        field,
        headerName: value.title,
        valueGetter,
        cellRenderer: (props: ICellRendererParams<Data, string | undefined>) => {
            if (!props.value) return null;
            const error = isPropertyInvalid(props, field, ignoreType);

            if (error) return errorColDef(props, error, value);
            return (
                <OpenMap
                    field={value.title!}
                    entityProperties={entityGetter(props as any)}
                    entityTemplate={template}
                    searchValue={searchValue}
                    disableOpenMap={ignoreType}
                />
            );
        },
        filter: 'agTextColumnFilter',
        width: hardcodedWidth,
        flex: isLastColumn ? 1 : 0,
        hide: hideColumn,
    };
};

export const relatedTemplateColDef = <Data extends any = EntityData>(
    field: string,
    valueGetter: ValueGetterFunc<Data>,
    value: Partial<IEntitySingleProperty>,
    hardcodedWidth: number | undefined,
    relatedTemplateId: string,
    relatedTemplateField: string,
    isLastColumn: boolean,
    entityTemplates: IEntityTemplateMap,
    hideColumn = false,
    searchValue: string | undefined = undefined,
    editable: (data: any) => boolean = () => false,
): ColDef => {
    const relatedEntityTemplate = entityTemplates.get(relatedTemplateId!)!;
    return {
        field,
        headerName: value.title,
        valueGetter,
        cellRenderer: (props: ICellRendererParams<Data, IEntity | undefined>) =>
            props.value ? (
                <RelationshipReferenceView
                    entity={props.value}
                    relatedTemplateId={relatedTemplateId}
                    relatedTemplateField={relatedTemplateField}
                    searchValue={searchValue}
                />
            ) : null,
        filter: 'agTextColumnFilter',
        width: hardcodedWidth,
        flex: isLastColumn ? 1 : 0,
        hide: hideColumn,
        editable: (params) => !!(relatedEntityTemplate && editable(params.data)),
        cellEditor: RelationshipRefCellEditor,
        cellEditorParams: {
            relatedTemplateId,
            template: value,
        },
    };
};

export const booleanColDef = <Data extends any = EntityData>(
    field: string,
    valueGetter: ValueGetterFunc<Data>,
    value: Partial<IEntitySingleProperty>,
    hardcodedWidth: number | undefined,
    isLastColumn: boolean,
    hideColumn = false,
    hideValue = false,
    ignoreType = false,
    searchValue: string | undefined = undefined,
    editable: (data: any) => boolean = () => false,
): ColDef => {
    const formatValue = (propertyValue: boolean | null | undefined) => {
        if (!propertyValue) return i18next.t('booleanOptions.no');
        return i18next.t('booleanOptions.yes');
    };

    const filterParams: ISetFilterParams<Data, boolean | undefined> = {
        valueFormatter: (params: ValueFormatterParams<Data, boolean | undefined>) => {
            if (params.value === null) return agGridLocaleText.blanks;

            return formatValue(params.value);
        },
        suppressMiniFilter: true,
        values: [true, false],
    };
    return {
        field,
        headerName: value.title,
        valueGetter,
        cellRenderer: (props: ICellRendererParams<Data, boolean | undefined>) => {
            const error = isPropertyInvalid(props, field, ignoreType);
            if (error) return errorColDef(props, error, value);
            return <Value hideValue={hideValue} value={formatValue(props.value)} searchValue={searchValue} />;
        },
        filter: 'agSetColumnFilter',
        filterParams,
        width: hardcodedWidth,
        flex: isLastColumn ? 1 : 0,
        hide: hideColumn,
        editable: (params) => editable(params.data) ?? false,
        cellEditor: 'agCheckboxCellEditor',
    };
};

export const enumColDef = <Data extends any = EntityData>(
    field: string,
    valueGetter: ValueGetterFunc<Data>,
    value: Partial<IEntitySingleProperty>,
    values: Array<string>,
    hardcodedWidth: number | undefined,
    isLastColumn: boolean,
    enumColorOptions?: Record<string, string>,
    hideColumn = false,
    hideValue = false,
    ignoreType = false,
    searchValue: string | undefined = undefined,
    editable: (data: any) => boolean = () => false,
): ColDef => {
    const filterParams: ISetFilterParams<Data, string | undefined> = {
        suppressMiniFilter: true,
        values: [...values, undefined],
    };

    return {
        field,
        headerName: value.title,
        valueGetter,
        cellRenderer: (props: ICellRendererParams<Data, string | undefined>) => {
            const error = isPropertyInvalid(props, field, ignoreType);
            if (error) return errorColDef(props, error, value);
            return (
                <Value
                    searchValue={searchValue}
                    hideValue={hideValue}
                    value={props.value ?? ''}
                    color={props.value && enumColorOptions?.[props.value]}
                />
            );
        },
        filter: 'agSetColumnFilter',
        filterParams,
        width: hardcodedWidth,
        flex: isLastColumn ? 1 : 0,
        hide: hideColumn,
        editable: (params) => editable(params.data) ?? false,
        cellEditor: SelectCellEditor,
        cellEditorParams: {
            options: values,
            multiple: false,
            colorsOptions: enumColorOptions,
        },
    };
};

export const enumArrayColDef = <Data extends any = EntityData>(
    field: string,
    valueGetter: ValueGetterFunc<Data>,
    value: Partial<IEntitySingleProperty>,
    values: Array<string>,
    hardcodedWidth: number | undefined,
    rowHeight: number,
    isLastColumn: boolean,
    enumColorOptions?: Record<string, string>,
    hideColumn = false,
    hideValue = false,
    ignoreType = false,
    searchValue: string | undefined = undefined,
    editable: (data: any) => boolean = () => false,
): ColDef => {
    const filterParams: ISetFilterParams<Data, string | undefined> = {
        suppressMiniFilter: true,
        values: [...values, undefined],
    };

    return {
        field,
        headerName: value.title,
        valueGetter,
        cellRenderer: (props: ICellRendererParams<Data, string[] | undefined>) => {
            if (!props.value) return '';
            const error = isPropertyInvalid(props, field, ignoreType);
            if (error) return errorColDef(props, error, value);
            if (ignoreType) return typeof props.value === 'string' ? props.value : props.value.join(', ');

            return (
                <OverflowWrapper
                    searchValue={searchValue}
                    items={props.value}
                    getItemKey={(item) => item}
                    renderItem={(item) => (
                        <Value hideValue={hideValue} value={item} color={enumColorOptions?.[item] || 'default'} searchValue={searchValue} />
                    )}
                    containerStyle={{ height: `${rowHeight}px` }}
                />
            );
        },
        filter: 'agSetColumnFilter',
        filterParams,
        width: hardcodedWidth,
        flex: isLastColumn ? 1 : 0,
        hide: hideColumn,
        editable: (params) => editable(params.data) ?? false,
        cellEditor: SelectCellEditor,
        cellEditorParams: {
            options: values,
            multiple: true,
            colorsOptions: enumColorOptions,
        },
    };
};
export const userColDef = <Data extends any = IUser>(
    field: string,
    valueGetter: ValueGetterFunc<Data>,
    value: { title: string },
    values: Array<string>,
    hardcodedWidth: number | undefined,
    isLastColumn: boolean,
    hideColumn = false,
): ColDef => {
    const filterParams: ISetFilterParams<Data, string | undefined> = {
        suppressMiniFilter: true,
        values: [...values, undefined],
    };

    return {
        field,
        headerName: value.title,
        valueGetter,

        cellRenderer: (props: ICellRendererParams<Data, any | undefined>) => {
            if (!props.value) return '';
            return (
                <Grid container gap={1}>
                    <MeltaTooltip title={`${JSON.parse(props.value).fullName} - ${JSON.parse(props.value).hierarchy}`}>
                        <Grid item>
                            <Chip
                                avatar={<UserAvatar user={JSON.parse(props.value)} size={25} bgColor="1E2775" />}
                                label={JSON.parse(props.value).fullName}
                            />
                        </Grid>
                    </MeltaTooltip>
                </Grid>
            );
        },

        filter: 'agTextColumnFilter',
        filterParams,
        width: hardcodedWidth,
        flex: isLastColumn ? 1 : 0,
        hide: hideColumn,
    };
};

export const userArrayColDef = <Data extends any = IEntity>(
    field: string,
    valueGetter: ValueGetterFunc<Data>,
    value: { title: string },
    values: Array<string>,
    hardcodedWidth: number | undefined,
    rowHeight: number,
    isLastColumn: boolean,
    hideColumn = false,
): ColDef => {
    const filterParams: ISetFilterParams<Data, string | undefined> = {
        suppressMiniFilter: true,
        values: [...values, undefined],
    };

    return {
        field,
        headerName: value.title,
        valueGetter,

        cellRenderer: (props: ICellRendererParams<Data, any[] | undefined>) => {
            if (!props.value) return '';
            return (
                <OverflowWrapper
                    items={props.value.map((val) => {
                        try {
                            return JSON.parse(val);
                        } catch {
                            return JSON.parse(JSON.stringify(val));
                        }
                    })}
                    getItemKey={(item) => item._id}
                    renderItem={(item) => (
                        <MeltaTooltip title={`${item.fullName} - ${item.hierarchy}`} key={item._id}>
                            <Grid item>
                                <Chip avatar={<UserAvatar user={item} size={25} bgColor="1E2775" />} label={item.fullName} />
                            </Grid>
                        </MeltaTooltip>
                    )}
                    propertyToDisplayInTooltip="fullName"
                    containerStyle={{ height: `${rowHeight}px` }}
                />
            );
        },

        filter: 'agSetColumnFilter',
        filterParams,
        width: hardcodedWidth,
        flex: isLastColumn ? 1 : 0,
        hide: hideColumn,
    };
};

export const enumFilesColDef = <Data extends any = EntityData>(
    field: string,
    valueGetter: ValueGetterFunc<Data>,
    value: { title: string },
    hardcodedWidth: number | undefined,
    rowHeight: number,
    isLastColumn: boolean,
    hideColumn = false,
    searchValue: string | undefined = undefined,
    entityFileIdsWithTexts: ISemanticSearchResult[string][string] | undefined = undefined,
): ColDef => {
    const filterParams: ISetFilterParams<Data, string | undefined> = {
        suppressMiniFilter: true,
        values: [], // You may need to fetch enum values dynamically or provide them here
    };

    return {
        field,
        headerName: value.title,
        valueGetter,
        cellRenderer: (props) => {
            const enumArray = valueGetter(props) as string[];
            if (enumArray && enumArray.length > 0) {
                const items = enumArray.map((file) => getFileName(file));
                return (
                    <OverflowWrapper
                        searchValue={searchValue}
                        items={enumArray}
                        getItemKey={(item) => item}
                        renderItem={(item) => <OpenPreview fileId={item} entityFileIdsWithTexts={entityFileIdsWithTexts} searchValue={searchValue} />}
                        containerStyle={{ height: `${rowHeight}px` }}
                        files={items}
                    />
                );
            }
            return null;
        },
        filter: 'agSetColumnFilter',
        filterParams,
        width: hardcodedWidth,
        flex: isLastColumn ? 1 : 0,
        hide: hideColumn,
    };
};

export const dateColDef = <Data extends any = EntityData>(
    field: string,
    valueGetter: ValueGetterFunc<Data>,
    value: Partial<IEntitySingleProperty>,
    isLastColumn: boolean,
    hardcodedWidth?: number,
    hideColumn = false,
    hideValue = false,
    calculateTime = false,
    ignoreType = false,
    searchValue: string | undefined = undefined,
    editable: (data: any) => boolean = () => false,
): ColDef => {
    const { format } = value;

    const formatDate = (dateValue: string | null | undefined) => {
        if (!dateValue) return '';
        if (ignoreType) return dateValue;

        if (format === 'date') return getDateWithoutTime(new Date(dateValue));

        if (format === 'date-time') return getLongDate(new Date(dateValue));

        throw new Error(`dateColfDef must be on date/date-time property, but found property: ${value}`);
    };

    const filterParams: IDateFilterParams = {
        comparator: (filterLocalDateAtMidnight, cellValue: string) => {
            if (!cellValue) {
                return 0;
            }

            const cellDate = new Date(cellValue);

            if (cellDate < filterLocalDateAtMidnight) return -1;
            if (cellDate > filterLocalDateAtMidnight) return 1;
            return 0;
        },
    };

    return {
        field,
        headerName: value.title,
        valueGetter,
        cellRenderer: (props: ICellRendererParams<Data, string | undefined>) => {
            const error = isPropertyInvalid(props, field, ignoreType);
            if (error) return errorColDef(props, error, value);
            return (
                <Value
                    searchValue={searchValue}
                    hideValue={hideValue}
                    value={formatDate(props.value?.toString())}
                    calculateTime={ignoreType ? false : calculateTime}
                />
            );
        },
        filter: 'agDateColumnFilter',
        filterParams,
        minWidth: format === 'date-time' ? 220 : undefined,
        width: hardcodedWidth,
        flex: isLastColumn ? 1 : 0,
        hide: hideColumn,
        editable: (params) => editable(params.data) ?? false,
        cellEditor: DateTimeCellEditor,
        cellEditorParams: { dateOrDateTime: format === 'date-time' ? 'dateTime' : 'date' },
    };
};

interface TranslatedEnumColDefOptions<Data> {
    field: string;
    valueGetter: (params: ValueGetterParams<Data>) => string | undefined;
    title: string;
    valuesMap: Record<string, string>;
    hardcodedWidth?: number;
    hideColumn?: boolean;
    hideValue?: boolean;
    searchValue?: string;
    isLastColumn?: boolean;
}

export const translatedEnumColDef = <Data extends any = EntityData>({
    field,
    valueGetter,
    title,
    valuesMap,
    hardcodedWidth,
    hideColumn = false,
    hideValue = false,
    searchValue = undefined,
    isLastColumn = false,
}: TranslatedEnumColDefOptions<Data>): ColDef => {
    const formatValue = (propertyValue: string | null | undefined) => (propertyValue ? valuesMap[propertyValue] : '');

    const filterParams: ISetFilterParams<Data, string | undefined> = {
        suppressMiniFilter: true,
        valueFormatter: (params: ValueFormatterParams<Date, string | undefined>) => {
            if (params.value === null) return agGridLocaleText.blanks;

            return formatValue(params.value);
        },
        values: [...Object.keys(valuesMap), undefined],
    };

    return {
        field,
        headerName: title,
        valueGetter,
        cellRenderer: (props: ICellRendererParams<Data, string | undefined>) => {
            return <Value hideValue={hideValue} value={formatValue(props.value)} searchValue={searchValue} />;
        },
        filter: 'agSetColumnFilter',
        filterParams,
        width: hardcodedWidth,
        flex: isLastColumn ? 1 : 0,
        hide: hideColumn,
    };
};
