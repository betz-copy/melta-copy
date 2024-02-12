import { ColDef, ICellRendererParams, IDateFilterParams, ISetFilterParams, ValueFormatterParams, ValueGetterFunc } from '@ag-grid-community/core';
import i18next from 'i18next';
import React from 'react';
import { OpenPreview } from '../../common/FilePreview/OpenPreview';
import { IEntity } from '../../interfaces/entities';
import { getDateWithoutTime, getLongDate } from '../date';
import OverflowWrapper from './OverflowWrapper';
import { Value } from './Value';
import { agGridLocaleText } from './agGridLocaleText';

export const numberColDef = <Data extends any = IEntity>(
    field: string,
    valueGetter: ValueGetterFunc<Data>,
    value: { title: string },
    hardcodedWidth: number | undefined,
    hideColumn = false,
    hideValue = false,
): ColDef<Data> => {
    return {
        field,
        headerName: value.title,
        valueGetter,
        filter: 'agNumberColumnFilter',
        cellRenderer: (props: ICellRendererParams<Data, number | undefined>) => (
            <Value hideValue={hideValue} value={props.value?.toString() ?? ''} isNumberField />
        ),
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
): ColDef<Data> => {
    return {
        field,
        headerName: value.title,
        cellRenderer: (props: ICellRendererParams<Data, string | undefined>) => <Value hideValue={hideValue} value={props.value ?? ''} />,
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
): ColDef<Data> => {
    return {
        field,
        headerName: value.title,
        cellRenderer: (props: ICellRendererParams<Data, string | undefined>) => <Value hideValue={hideValue} value={props.value ?? ''} />,
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
): ColDef<Data> => {
    return {
        field,
        headerName: value.title,
        valueGetter,
        cellRenderer: (props: ICellRendererParams<Data, string | undefined>) => (props.value ? <OpenPreview fileId={props.value} /> : null),
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
): ColDef<Data> => {
    const formatValue = (propertyValue: boolean | undefined) => {
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
        cellRenderer: (props: ICellRendererParams<Data, boolean | undefined>) => <Value hideValue={hideValue} value={formatValue(props.value)} />,
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
): ColDef<Data> => {
    const filterParams: ISetFilterParams<Data, string | undefined> = {
        suppressMiniFilter: true,
        values: [...values, undefined],
    };

    return {
        field,
        headerName: value.title,
        valueGetter,
        cellRenderer: (props: ICellRendererParams<Data, string | undefined>) => {
            return <Value hideValue={hideValue} value={props.value ?? ''} color={props.value && enumColorOptions?.[props.value]} />;
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
): ColDef<Data> => {
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
            return (
                <OverflowWrapper
                    items={props.value}
                    getItemKey={(item) => item}
                    renderItem={(item) => <Value hideValue={hideValue} value={item} color={enumColorOptions?.[item] || 'default'} />}
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
export const dateColDef = <Data extends any = IEntity>(
    field: string,
    valueGetter: ValueGetterFunc<Data>,
    value: { title: string; format?: string },
    hardcodedWidth?: number,
    hideColumn = false,
    hideValue = false,
): ColDef<Data> => {
    const { format } = value;

    const formatDate = (dateValue: string | undefined) => {
        if (!dateValue) return '';

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
        cellRenderer: (props: ICellRendererParams<Data, string | undefined>) => <Value hideValue={hideValue} value={formatDate(props.value)} />,
        filter: 'agDateColumnFilter',
        filterParams,
        minWidth: format === 'date-time' ? 220 : undefined,
        width: hardcodedWidth,
        flex: hardcodedWidth ? 0 : 1,
        hide: hideColumn,
    };
};

export const translatedEnumColDef = <Data extends any = IEntity>(
    field: string,
    valueGetter: ValueGetterFunc<Data>,
    value: { title: string },
    valuesMap: Record<string, string>,
    hardcodedWidth?: number,
    hideColumn = false,
    hideValue = false,
): ColDef<Data> => {
    const formatValue = (propertyValue: string | undefined) => (propertyValue ? valuesMap[propertyValue] : '');

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
        headerName: value.title,
        valueGetter,
        cellRenderer: (props: ICellRendererParams<Data, string | undefined>) => <Value hideValue={hideValue} value={formatValue(props.value)} />,
        filter: 'agSetColumnFilter',
        filterParams,
        width: hardcodedWidth,
        flex: hardcodedWidth ? 0 : 1,
        hide: hideColumn,
    };
};
