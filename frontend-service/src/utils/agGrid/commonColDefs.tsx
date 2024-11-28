import {
    ColDef,
    ICellRendererParams,
    IDateFilterParams,
    ISetFilterParams,
    ValueFormatterParams,
    ValueGetterFunc,
    ValueGetterParams,
} from '@ag-grid-community/core';
import i18next from 'i18next';
import React from 'react';
import { Box, Tooltip, tooltipClasses } from '@mui/material';
import { PriorityHigh } from '@mui/icons-material';
import OpenPreview from '../../common/FilePreview/OpenPreview';
import RelationshipReferenceView from '../../common/RelationshipReferenceView';
import { IEntity } from '../../interfaces/entities';
import { getDateWithoutTime, getLongDate } from '../date';
import { getFileName } from '../getFileName';
import { agGridLocaleText } from './agGridLocaleText';
import OverflowWrapper from './OverflowWrapper';
import { Value } from './Value';
import { ActionErrors } from '../../interfaces/ruleBreaches/actionMetadata';

const isError = <Data extends any = IEntity>(props: ICellRendererParams<Data, any | undefined>, field: string, showErrors = false) => {
    if (showErrors && props.data && props.data.errors) {
        return props.data.errors.find((error) => {
            if (error.type === ActionErrors.required) return error.metadata.property === field;
            if (error.type === ActionErrors.unique) return error.metadata.properties.some((property) => property === field);
            if (error.type === ActionErrors.validation) return error.metadata.path.slice(1) === field;
            return false;
        });
    }
    return false;
};

const errorColDef = <Data extends any = IEntity>(props: ICellRendererParams<Data, any | undefined>, field: string) => {
    const error = isError(props, field, true);

    const message =
        error.metadata.message && error.metadata.message.includes('must be')
            ? `${i18next.t('wizard.entity.loadEntities.notValid')} ${i18next.t(`propertyTypes.${error.metadata.params.type}`)}`
            : error.metadata.message;

    return (
        <Box display="flex" justifyContent="space-between" alignItems="center" width="100%">
            <Value hideValue={false} value={props.value ?? i18next.t('validation.required')} color="#A40000" />
            <Tooltip
                title={message ?? i18next.t(`wizard.entity.${props.value ? 'someEntityAlreadyHasTheSameField' : 'loadEntities.required'}`)}
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
                <PriorityHigh color="error" fontSize="small" style={{ paddingLeft: '5px' }} />
            </Tooltip>
        </Box>
    );
};

export const numberColDef = <Data extends any = IEntity>(
    field: string,
    valueGetter: ValueGetterFunc<Data>,
    value: { title: string },
    hardcodedWidth: number | undefined,
    hideColumn = false,
    hideValue = false,
    showErrors = false,
    searchValue: string | undefined = undefined,
): ColDef => {
    return {
        field,
        headerName: value.title,
        valueGetter,
        filter: 'agNumberColumnFilter',
        cellRenderer: (props: ICellRendererParams<Data, number | undefined>) => {
            if (isError(props, field, showErrors)) return errorColDef(props, field);
            return <Value hideValue={hideValue} value={props.value?.toString() ?? ''} isNumberField={!showErrors} searchValue={searchValue} />;
        },
        width: hardcodedWidth,
        flex: hardcodedWidth ? 0 : 1,
        hide: hideColumn,
    };
};

export const regexColDef = <Data extends any = IEntity>(
    field: string,
    valueGetter: ValueGetterFunc<Data>,
    value: { title: string },
    hardcodedWidth: number | undefined,
    hideColumn = false,
    hideValue = false,
    showErrors = false,
    searchValue: string | undefined = undefined,
): ColDef => {
    return {
        field,
        headerName: value.title,
        cellRenderer: (props: ICellRendererParams<Data, string | undefined>) => {
            if (isError(props, field, showErrors)) return errorColDef(props, field);
            return <Value hideValue={hideValue} value={props.value ?? ''} searchValue={searchValue} />;
        },
        valueGetter,
        filter: 'agTextColumnFilter',
        width: hardcodedWidth,
        flex: hardcodedWidth ? 0 : 1,
        hide: hideColumn,
        cellStyle: { direction: 'ltr' },
    };
};

export const stringColDef = <Data extends any = IEntity>(
    field: string,
    valueGetter: ValueGetterFunc<Data>,
    value: { title: string },
    hardcodedWidth: number | undefined,
    hideColumn = false,
    hideValue = false,
    showErrors = false,
    searchValue: string | undefined = undefined,
): ColDef => {
    return {
        field,
        headerName: value.title,
        cellRenderer: (props: ICellRendererParams<Data, string | undefined>) => {
            if (isError(props, field, showErrors)) return errorColDef(props, field);
            return <Value hideValue={hideValue} value={props.value?.toString() ?? ''} searchValue={searchValue} />;
        },
        valueGetter,
        filter: 'agTextColumnFilter',
        width: hardcodedWidth,
        flex: hardcodedWidth ? 0 : 1,
        hide: hideColumn,
    };
};

export const fileColDef = <Data extends any = IEntity>(
    field: string,
    valueGetter: ValueGetterFunc<Data>,
    value: { title: string },
    hardcodedWidth: number | undefined,
    hideColumn = false,
    searchValue: string | undefined = undefined,
    entityIdsToInclude: string[] | undefined = undefined,
): ColDef => {
    return {
        field,
        headerName: value.title,
        valueGetter,
        cellRenderer: (props: ICellRendererParams<Data, string | undefined>) =>
            props.value?.toString() ? (
                <OpenPreview fileId={props.value?.toString()} searchValue={searchValue} entityIdsToInclude={entityIdsToInclude} />
            ) : null,
        filter: 'agTextColumnFilter',
        width: hardcodedWidth,
        flex: hardcodedWidth ? 0 : 1,
        hide: hideColumn,
    };
};

export const relatedTemplateColDef = <Data extends any = IEntity>(
    field: string,
    valueGetter: ValueGetterFunc<Data>,
    value: { title: string },
    hardcodedWidth: number | undefined,
    relatedTemplateId: string,
    relatedTemplateField: string,
    hideColumn = false,
    searchValue: string | undefined = undefined,
): ColDef => {
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
        flex: hardcodedWidth ? 0 : 1,
        hide: hideColumn,
    };
};

export const booleanColDef = <Data extends any = IEntity>(
    field: string,
    valueGetter: ValueGetterFunc<Data>,
    value: { title: string },
    hardcodedWidth: number | undefined,
    hideColumn = false,
    hideValue = false,
    showErrors = false,
    searchValue: string | undefined = undefined,
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
            if (isError(props, field, showErrors)) return errorColDef(props, field);
            return <Value hideValue={hideValue} value={formatValue(props.value)} searchValue={searchValue} />;
        },
        filter: 'agSetColumnFilter',
        filterParams,
        width: hardcodedWidth,
        flex: hardcodedWidth ? 0 : 1,
        hide: hideColumn,
    };
};

export const enumColDef = <Data extends any = IEntity>(
    field: string,
    valueGetter: ValueGetterFunc<Data>,
    value: { title: string },
    values: Array<string>,
    hardcodedWidth: number | undefined,
    enumColorOptions?: Record<string, string>,
    hideColumn = false,
    hideValue = false,
    showErrors = false,
    searchValue: string | undefined = undefined,
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
            if (isError(props, field, showErrors)) return errorColDef(props, field);
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
        flex: hardcodedWidth ? 0 : 1,
        hide: hideColumn,
    };
};

export const enumArrayColDef = <Data extends any = IEntity>(
    field: string,
    valueGetter: ValueGetterFunc<Data>,
    value: { title: string },
    values: Array<string>,
    hardcodedWidth: number | undefined,
    rowHeight: number,
    enumColorOptions?: Record<string, string>,
    hideColumn = false,
    hideValue = false,
    showErrors = false,
    searchValue: string | undefined = undefined,
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
            if (isError(props, field, showErrors)) return errorColDef(props, field);
            if (showErrors) return props.value.join(', ');
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
        flex: hardcodedWidth ? 0 : 1,
        hide: hideColumn,
    };
};

export const enumFilesColDef = <Data extends any = IEntity>(
    field: string,
    valueGetter: ValueGetterFunc<Data>,
    value: { title: string },
    hardcodedWidth: number | undefined,
    rowHeight: number,
    hideColumn = false,
    searchValue: string | undefined = undefined,
    entityIdsToInclude: string[] | undefined = undefined,
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
                        renderItem={(item) => <OpenPreview fileId={item} entityIdsToInclude={entityIdsToInclude} searchValue={searchValue} />}
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
        flex: hardcodedWidth ? 0 : 1,
        hide: hideColumn,
    };
};

export const dateColDef = <Data extends any = IEntity>(
    field: string,
    valueGetter: ValueGetterFunc<Data>,
    value: Record<string, any>,
    hardcodedWidth?: number,
    hideColumn = false,
    hideValue = false,
    calculateTime = false,
    showErrors = false,
    searchValue: string | undefined = undefined,
): ColDef => {
    const { format } = value;

    const formatDate = (dateValue: string | null | undefined) => {
        if (!dateValue) return '';
        if (showErrors) return dateValue;

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
            if (isError(props, field, showErrors)) return errorColDef(props, field);
            return (
                <Value
                    searchValue={searchValue}
                    hideValue={hideValue}
                    value={formatDate(props.value?.toString())}
                    calculateTime={showErrors ? false : calculateTime}
                />
            );
        },
        filter: 'agDateColumnFilter',
        filterParams,
        minWidth: format === 'date-time' ? 220 : undefined,
        width: hardcodedWidth,
        flex: hardcodedWidth ? 0 : 1,
        hide: hideColumn,
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
}

export const translatedEnumColDef = <Data extends any = IEntity>({
    field,
    valueGetter,
    title,
    valuesMap,
    hardcodedWidth,
    hideColumn = false,
    hideValue = false,
    searchValue = undefined,
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
        flex: hardcodedWidth ? 0 : 1,
        hide: hideColumn,
    };
};
