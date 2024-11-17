import { ColDef, ICellRendererParams, IDateFilterParams, ISetFilterParams, ValueFormatterParams, ValueGetterFunc } from '@ag-grid-community/core';
import i18next from 'i18next';
import React from 'react';
import { Box } from '@mui/material';
import { PriorityHigh } from '@mui/icons-material';
import OpenPreview from '../../common/FilePreview/OpenPreview';
import { IEntity } from '../../interfaces/entities';
import { getDateWithoutTime, getLongDate } from '../date';
import OverflowWrapper from './OverflowWrapper';
import { Value } from './Value';
import { agGridLocaleText } from './agGridLocaleText';
import { getFileName } from '../getFileName';
import RelationshipReferenceView from '../../common/RelationshipReferenceView';
import { MeltaTooltip } from '../../common/MeltaTooltip';

const errorColDef = <Data extends any = IEntity>(props: ICellRendererParams<Data, any | undefined>, field: string) => {
    const error = props.data!.errors.find((error) => error.path.slice(1) === field);

    return (
        <Box display="flex" justifyContent="space-between" alignItems="center" width="100%">
            <Value hideValue={false} value={props.value} color="#A40000" />
            <MeltaTooltip title={error.message}>
                <PriorityHigh color="error" fontSize="small" style={{ paddingLeft: '5px' }} />
            </MeltaTooltip>
        </Box>
    );
};
const isError = <Data extends any = IEntity>(props: ICellRendererParams<Data, any | undefined>, field: string, showErrors = false) =>
    showErrors && props.data && props.data.errors && props.data.errors.find((error) => error.path.slice(1) === field);
export const numberColDef = <Data extends any = IEntity>(
    field: string,
    valueGetter: ValueGetterFunc<Data>,
    value: { title: string },
    hardcodedWidth: number | undefined,
    hideColumn = false,
    hideValue = false,
    showErrors = false,
): ColDef<Data> => {
    return {
        field,
        headerName: value.title,
        valueGetter,
        filter: 'agNumberColumnFilter',
        cellRenderer: (props: ICellRendererParams<Data, number | undefined>) => {
            if (isError(props, field, showErrors)) return errorColDef(props, field);
            return <Value hideValue={hideValue} value={props.value?.toString() ?? ''} isNumberField={!showErrors} />;
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
): ColDef<Data> => {
    return {
        field,
        headerName: value.title,
        cellRenderer: (props: ICellRendererParams<Data, string | undefined>) => {
            if (isError(props, field, showErrors)) return errorColDef(props, field);
            return <Value hideValue={hideValue} value={props.value ?? ''} />;
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
): ColDef<Data> => {
    return {
        field,
        headerName: value.title,
        cellRenderer: (props: ICellRendererParams<Data, string | undefined>) => {
            if (isError(props, field, showErrors)) return errorColDef(props, field);
            return <Value hideValue={hideValue} value={props.value ?? ''} />;
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

export const relatedTemplateColDef = <Data extends any = IEntity>(
    field: string,
    valueGetter: ValueGetterFunc<Data>,
    value: { title: string },
    hardcodedWidth: number | undefined,
    relatedTemplateId: string,
    relatedTemplateField: string,
    hideColumn = false,
): ColDef<Data> => {
    return {
        field,
        headerName: value.title,
        valueGetter,
        cellRenderer: (props: ICellRendererParams<Data, IEntity | undefined>) =>
            props.value ? (
                <RelationshipReferenceView entity={props.value} relatedTemplateId={relatedTemplateId} relatedTemplateField={relatedTemplateField} />
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
        cellRenderer: (props: ICellRendererParams<Data, boolean | undefined>) => {
            if (isError(props, field, showErrors)) return errorColDef(props, field);
            return <Value hideValue={hideValue} value={formatValue(props.value)} />;
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
            if (isError(props, field, showErrors)) return errorColDef(props, field);
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
    showErrors = false,
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
            if (isError(props, field, showErrors)) return errorColDef(props, field);
            if (showErrors) return props.value;
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

export const enumFilesColDef = <Data extends any = IEntity>(
    field: string,
    valueGetter: ValueGetterFunc<Data>,
    value: { title: string },
    hardcodedWidth: number | undefined,
    rowHeight: number,
    hideColumn = false,
): ColDef<Data> => {
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
                        items={enumArray}
                        getItemKey={(item) => item}
                        renderItem={(item) => <OpenPreview fileId={item} />}
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
    value: { title: string; format?: string },
    hardcodedWidth?: number,
    hideColumn = false,
    hideValue = false,
    calculateTime = false,
    showErrors = false,
): ColDef<Data> => {
    const { format } = value;

    const formatDate = (dateValue: string | undefined) => {
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
            return <Value hideValue={hideValue} value={formatDate(props.value)} calculateTime={calculateTime} />;
        },
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
    showErrors = false,
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
        cellRenderer: (props: ICellRendererParams<Data, string | undefined>) => {
            if (isError(props, field, showErrors)) return errorColDef(props, field);
            return <Value hideValue={hideValue} value={showErrors ? props.value : formatValue(props.value)} />;
        },
        filter: 'agSetColumnFilter',
        filterParams,
        width: hardcodedWidth,
        flex: hardcodedWidth ? 0 : 1,
        hide: hideColumn,
    };
};
