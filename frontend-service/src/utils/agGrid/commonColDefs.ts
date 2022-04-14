import { ColDef, ValueFormatterParams } from 'ag-grid-community';
import i18next from 'i18next';

export const numberColDef = (key: string, value: { title: string }): ColDef => {
    return {
        headerName: value.title,
        field: key,
        filter: 'agNumberColumnFilter',
    };
};

export const stringColDef = (key: string, value: { title: string }): ColDef => {
    return {
        headerName: value.title,
        field: key,
        filter: 'agTextColumnFilter',
    };
};

export const booleanColDef = (key: string, value: { title: string }): ColDef => {
    const valueFormatter = (params: ValueFormatterParams) => {
        if (String(params.value) === 'true') return i18next.t('booleanOptions.yes');
        if (String(params.value) === 'false') return i18next.t('booleanOptions.no');

        return params.value;
    };

    return {
        headerName: value.title,
        field: key,
        filter: 'agSetColumnFilter',
        valueFormatter,
        filterParams: {
            valueFormatter,
            values: [true, false, undefined],
        },
    };
};

export const dateColDef = (key: string, value: { title: string; format?: string }): ColDef => {
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
        headerName: value.title,
        field: key,
        filter: 'agDateColumnFilter',
        valueFormatter,
        filterParams: {
            valueFormatter,
            comparator,
        },
    };
};
