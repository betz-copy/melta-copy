import { ColDef, ValueFormatterParams, ValueGetterFunc } from '@ag-grid-community/core';
import i18next from 'i18next';

export const numberColDef = (field: string, valueGetter: ValueGetterFunc, value: { title: string }): ColDef => {
    return {
        field,
        headerName: value.title,
        valueGetter,
        filter: 'agNumberColumnFilter',
    };
};

export const stringColDef = (field: string, valueGetter: ValueGetterFunc, value: { title: string }): ColDef => {
    return {
        field,
        headerName: value.title,
        valueGetter,
        filter: 'agTextColumnFilter',
    };
};

export const booleanColDef = (field: string, valueGetter: ValueGetterFunc, value: { title: string }): ColDef => {
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
    };
};

export const dateColDef = (field: string, valueGetter: ValueGetterFunc, value: { title: string; format?: string }): ColDef => {
    const { format } = value;

    const valueFormatter = (params: ValueFormatterParams) => {
        if (!params.value) return '';

        if (format === 'date') return new Date(params.value).toLocaleDateString('en-uk');

        if (format === 'date-time') return new Date(params.value).toLocaleString('en-uk');

        return params.value;
    };

    const comparator = (filterLocalDateAtMidnight: Date, cellValue: string) => {
        if (cellValue == null) {
            return 0;
        }

        const yearAndMonth = cellValue.split('-');
        const dateAndTime = yearAndMonth[2].split('T');
        yearAndMonth.pop();
        const dateParts = [...yearAndMonth, ...dateAndTime];

        const year = Number(dateParts[0]);
        const month = Number(dateParts[1]) - 1;
        const day = Number(dateParts[2]);

        const cellDate = new Date(year, month, day);

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
    };
};
