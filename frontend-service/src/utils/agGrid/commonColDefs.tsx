import React from 'react';
import { ColDef, ICellRendererParams, IDateFilterParams, ISetFilterParams, ValueFormatterParams, ValueGetterFunc } from '@ag-grid-community/core';
import i18next from 'i18next';
import { DownloadButton } from '../../common/DownloadButton';
import { Value } from './Value';
import { getDateWithoutTime, getLongDate } from '../date';
import { IEntity } from '../../interfaces/entities';
import { agGridLocaleText } from './agGridLocaleText';

export const numberColDef = <Data extends any = IEntity>(
    field: string,
    valueGetter: ValueGetterFunc<Data>,
    value: { title: string },
    hideColumn = false,
    hideValue = false,
): ColDef<Data> => {
    return {
        field,
        headerName: value.title,
        valueGetter,
        filter: 'agNumberColumnFilter',
        cellRenderer: (props: ICellRendererParams<Data, number | undefined>) => <Value hideValue={hideValue} value={props.value?.toString() ?? ''} />,
        hide: hideColumn,
        cellStyle: { direction: 'ltr' },
    };
};

export const regexColDef = <Data extends any = IEntity>(
    field: string,
    valueGetter: ValueGetterFunc<Data>,
    value: { title: string },
    hideColumn = false,
    hideValue = false,
): ColDef<Data> => {
    return {
        field,
        headerName: value.title,
        cellRenderer: (props: ICellRendererParams<Data, string | undefined>) => <Value hideValue={hideValue} value={props.value ?? ''} />,
        valueGetter,
        filter: 'agTextColumnFilter',
        hide: hideColumn,
        cellStyle: { direction: 'ltr' },
    };
};

export const stringColDef = <Data extends any = IEntity>(
    field: string,
    valueGetter: ValueGetterFunc<Data>,
    value: { title: string },
    hideColumn = false,
    hideValue = false,
): ColDef<Data> => {
    return {
        field,
        headerName: value.title,
        cellRenderer: (props: ICellRendererParams<Data, string | undefined>) => <Value hideValue={hideValue} value={props.value ?? ''} />,
        valueGetter,
        filter: 'agTextColumnFilter',
        hide: hideColumn,
    };
};

export const fileColDef = <Data extends any = IEntity>(
    field: string,
    valueGetter: ValueGetterFunc<Data>,
    value: { title: string },
    hideColumn = false,
): ColDef<Data> => {
    return {
        field,
        headerName: value.title,
        valueGetter,
        menuTabs: [],
        cellRenderer: (props: ICellRendererParams<Data, string | undefined>) => (props.value ? <DownloadButton fileId={props.value} /> : null),
        hide: hideColumn,
    };
};

export const booleanColDef = <Data extends any = IEntity>(
    field: string,
    valueGetter: ValueGetterFunc<Data>,
    value: { title: string },
    hideColumn = false,
    hideValue = false,
): ColDef<Data> => {
    const formatValue = (propertyValue: boolean | undefined) => {
        if (propertyValue === true) return i18next.t('booleanOptions.yes');
        if (propertyValue === false) return i18next.t('booleanOptions.no');
        return '';
    };

    const filterParams: ISetFilterParams<Data, boolean | undefined> = {
        valueFormatter: (params: ValueFormatterParams<Data, boolean | undefined>) => {
            if (params.value === null) return agGridLocaleText.blanks;

            return formatValue(params.value);
        },
        suppressMiniFilter: true,
        values: [true, false, undefined],
    };

    return {
        field,
        headerName: value.title,
        valueGetter,
        cellRenderer: (props: ICellRendererParams<Data, boolean | undefined>) => <Value hideValue={hideValue} value={formatValue(props.value)} />,
        filter: 'agSetColumnFilter',
        filterParams,
        hide: hideColumn,
    };
};
export const enumColDef = <Data extends any = IEntity>(
    field: string,
    valueGetter: ValueGetterFunc<Data>,
    value: { title: string },
    values: Array<string>,
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
        cellRenderer: (props: ICellRendererParams<Data, string | undefined>) => <Value hideValue={hideValue} value={props.value ?? ''} />,
        filter: 'agSetColumnFilter',
        filterParams,
        hide: hideColumn,
    };
};
export const dateColDef = <Data extends any = IEntity>(
    field: string,
    valueGetter: ValueGetterFunc<Data>,
    value: { title: string; format?: string },
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
        hide: hideColumn,
    };
};

export const translatedEnumColDef = <Data extends any = IEntity>(
    field: string,
    valueGetter: ValueGetterFunc<Data>,
    value: { title: string },
    valuesMap: Record<string, string>,
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
        hide: hideColumn,
    };
};
