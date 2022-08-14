import React from 'react';
import { ColDef, ValueFormatterParams, ValueGetterFunc } from '@ag-grid-community/core';
import i18next from 'i18next';
import { DownloadButton } from '../../common/DownloadButton';

export const numberColDef = (field: string, valueGetter: ValueGetterFunc, value: { title: string }, hide = false): ColDef => {
    return {
        field,
        headerName: value.title,
        valueGetter,
        filter: 'agNumberColumnFilter',
        hide,
        cellStyle: { direction: 'ltr' },
    };
};

export const stringColDef = (field: string, valueGetter: ValueGetterFunc, value: { title: string }, hide = false): ColDef => {
    return {
        field,
        headerName: value.title,
        valueGetter,
        filter: 'agTextColumnFilter',
        hide,
    };
};

export const fileColDef = (field: string, valueGetter: ValueGetterFunc, value: { title: string }, hide = false): ColDef => {
    return {
        field,
        headerName: value.title,
        valueGetter,
        menuTabs: [],
        cellRenderer: (props) => <DownloadButton fileId={props.value} />,
        hide,
    };
};

export const booleanColDef = (field: string, valueGetter: ValueGetterFunc, value: { title: string }, hide = false): ColDef => {
    const valueFormatter = (params: ValueFormatterParams) => {
        if (String(params.value) === 'true') return i18next.t('booleanOptions.yes');
        if (String(params.value) === 'false') return i18next.t('booleanOptions.no');

        return params.value;
    };

    return {
        field,
        headerName: value.title,
        valueGetter,
        filter: 'agSetColumnFilter',
        valueFormatter,
        filterParams: {
            valueFormatter,
            suppressMiniFilter: true,
            values: [true, false, undefined],
        },
        hide,
    };
};
export const enumColDef = (field: string, valueGetter: ValueGetterFunc, value: { title: string }, values: Array<string>, hide = false): ColDef => {
    return {
        field,
        headerName: value.title,
        valueGetter,
        filter: 'agSetColumnFilter',
        filterParams: {
            suppressMiniFilter: true,
            values: [...values, undefined],
        },
        hide,
    };
};
export const dateColDef = (field: string, valueGetter: ValueGetterFunc, value: { title: string; format?: string }, hide = false): ColDef => {
    const { format } = value;

    const valueFormatter = (params: ValueFormatterParams) => {
        if (!params.value) return '';

        if (format === 'date') return new Date(params.value).toLocaleDateString('en-uk');

        if (format === 'date-time') return new Date(params.value).toLocaleString('en-uk');

        return params.value;
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
        filter: 'agDateColumnFilter',
        valueFormatter,
        filterParams: {
            valueFormatter,
            comparator,
        },
        minWidth: format === 'date-time' ? 220 : undefined,
        hide,
    };
};
