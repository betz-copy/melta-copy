import React from 'react';
import { ColDef, ValueGetterFunc } from '@ag-grid-community/core';
import i18next from 'i18next';
import { DownloadButton } from '../../common/DownloadButton';
import { Value } from './Value';
import { getDateWithoutTime, getLongDate } from '../date';

export const numberColDef = (
    field: string,
    valueGetter: ValueGetterFunc,
    value: { title: string },
    hideColumn = false,
    hideValue = false,
): ColDef => {
    return {
        field,
        headerName: value.title,
        valueGetter,
        filter: 'agNumberColumnFilter',
        cellRenderer: (props) => <Value hideValue={hideValue} value={props.value} />,
        hide: hideColumn,
        cellStyle: { direction: 'ltr' },
    };
};

export const regexColDef = (field: string, valueGetter: ValueGetterFunc, value: { title: string }, hideColumn = false, hideValue = false): ColDef => {
    return {
        field,
        headerName: value.title,
        cellRenderer: (props) => <Value hideValue={hideValue} value={props.value} />,
        valueGetter,
        filter: 'agTextColumnFilter',
        hide: hideColumn,
        cellStyle: { direction: 'ltr' },
    };
};

export const stringColDef = (
    field: string,
    valueGetter: ValueGetterFunc,
    value: { title: string },
    hideColumn = false,
    hideValue = false,
): ColDef => {
    return {
        field,
        headerName: value.title,
        cellRenderer: (props) => <Value hideValue={hideValue} value={props.value} />,
        valueGetter,
        filter: 'agTextColumnFilter',
        hide: hideColumn,
    };
};

export const fileColDef = (field: string, valueGetter: ValueGetterFunc, value: { title: string }, hideColumn = false): ColDef => {
    return {
        field,
        headerName: value.title,
        valueGetter,
        menuTabs: [],
        cellRenderer: (props) => <DownloadButton fileId={props.value} />,
        hide: hideColumn,
    };
};

export const booleanColDef = (
    field: string,
    valueGetter: ValueGetterFunc,
    value: { title: string },
    hideColumn = false,
    hideValue = false,
): ColDef => {
    const valueFormatter = (props) => {
        if (String(props.value) === 'true') return i18next.t('booleanOptions.yes');
        if (String(props.value) === 'false') return i18next.t('booleanOptions.no');

        return props.value;
    };

    return {
        field,
        headerName: value.title,
        valueGetter,
        cellRenderer: (props) => <Value hideValue={hideValue} value={valueFormatter(props)} />,
        filter: 'agSetColumnFilter',
        filterParams: {
            valueFormatter,
            suppressMiniFilter: true,
            values: [true, false, undefined],
        },
        hide: hideColumn,
    };
};
export const enumColDef = (
    field: string,
    valueGetter: ValueGetterFunc,
    value: { title: string },
    values: Array<string>,
    hideColumn = false,
    hideValue = false,
): ColDef => {
    return {
        field,
        headerName: value.title,
        valueGetter,
        cellRenderer: (props) => <Value hideValue={hideValue} value={props.value} />,
        filter: 'agSetColumnFilter',
        filterParams: {
            suppressMiniFilter: true,
            values: [...values, undefined],
        },
        hide: hideColumn,
    };
};
export const dateColDef = (
    field: string,
    valueGetter: ValueGetterFunc,
    value: { title: string; format?: string },
    hideColumn = false,
    hideValue = false,
): ColDef => {
    const { format } = value;

    const valueFormatter = (props) => {
        if (!props.value) return '';

        if (format === 'date') return getDateWithoutTime(props.value);

        if (format === 'date-time') return getLongDate(props.value);

        return props.value;
    };

    const comparator = (filterLocalDateAtMidnight: Date, cellValue: string) => {
        if (!cellValue) {
            return 0;
        }

        const cellDate = new Date(cellValue);

        if (cellDate < filterLocalDateAtMidnight) return -1;
        if (cellDate > filterLocalDateAtMidnight) return 1;
        return 0;
    };

    return {
        field,
        headerName: value.title,
        valueGetter,
        cellRenderer: (props) => <Value hideValue={hideValue} value={valueFormatter(props)} />,
        filter: 'agDateColumnFilter',
        filterParams: {
            valueFormatter,
            comparator,
        },
        minWidth: format === 'date-time' ? 220 : undefined,
        hide: hideColumn,
    };
};

export const translatedEnumColDef = (
    field: string,
    valueGetter: ValueGetterFunc,
    value: { title: string },
    valuesMap: Record<string, string>,
    hideColumn = false,
    hideValue = false,
): ColDef => {
    const valueFormatter = (props) => valuesMap[props.value];

    return {
        field,
        headerName: value.title,
        valueGetter,
        cellRenderer: (props) => <Value hideValue={hideValue} value={valueFormatter(props)} />,
        filter: 'agSetColumnFilter',
        filterParams: {
            suppressMiniFilter: true,
            valueFormatter,
            values: [...Object.keys(valuesMap), undefined],
        },
        hide: hideColumn,
    };
};
