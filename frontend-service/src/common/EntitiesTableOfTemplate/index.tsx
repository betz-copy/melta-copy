import React, { forwardRef, ForwardedRef, useImperativeHandle, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box } from '@mui/material';
import pickBy from 'lodash.pickby';
import isEqual from 'lodash.isequal';
import { ColDef, GridApi, IServerSideDatasource, IServerSideGetRowsParams, IServerSideGetRowsRequest } from '@ag-grid-community/core';
import { AgGridReact } from '@ag-grid-community/react';
import '@noam7700/ag-grid-enterprise-core';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import { ColumnsToolPanelModule } from '@noam7700/ag-grid-enterprise-column-tool-panel';
import { MenuModule } from '@noam7700/ag-grid-enterprise-menu';
import { SetFilterModule } from '@noam7700/ag-grid-enterprise-set-filter';
import { ServerSideRowModelModule } from '@noam7700/ag-grid-enterprise-server-side-row-model';
import i18next from 'i18next';
import { toast } from 'react-toastify';
import { IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import { IAGGridRequest } from '../../utils/agGrid/interfaces';

import '@ag-grid-community/styles/ag-grid.css';
import '@ag-grid-community/styles/ag-theme-material.css';
import '../../css/table.css';

import { DateFilterComponent } from '../../utils/agGrid/DateFilterComponent';
import { agGridToSearchEntitiesOfTemplateRequest } from '../../utils/agGrid/agGridToSearchEntitiesOfTemplateRequest';
import { IEntity } from '../../interfaces/entities';
import { searchEntitiesOfTemplateRequest } from '../../services/entitiesService';
import { getColumnDefs } from './getColumnDefs';
import { trycatch } from '../../utils/trycatch';
import { LocalStorage } from '../../utils/localStorage';
import { environment } from '../../globals';

const { rowCount } = environment.agGrid;

export const defaultFilterModel = {
    disabled: {
        filterType: 'set',
        values: ['false'],
    },
};

export const getDatasource = <Data extends any = IEntity>(
    template: IMongoEntityTemplatePopulated,
    quickFilterText: string | undefined,
    onFail: ((err: unknown) => void) | undefined,
): IServerSideDatasource => {
    return {
        async getRows(params: IServerSideGetRowsParams<Data>) {
            const agGridRequest = params.request;
            const { result: data, err } = await trycatch(() =>
                searchEntitiesOfTemplateRequest(
                    template._id,
                    agGridToSearchEntitiesOfTemplateRequest({ ...agGridRequest, quickFilter: quickFilterText } as IAGGridRequest, template),
                ),
            );
            if (err || !data) {
                onFail?.(err);
                params.fail();
                return;
            }

            params.success({ rowData: data.entities.map(({ entity }) => entity), rowCount: data.count });
        },
    };
};

const getRowModelProps = <Data extends any = IEntity>(
    rowModelType: 'serverSide' | 'clientSide' | 'infinite',
    template: IMongoEntityTemplatePopulated,
    rowData: Data[] | undefined,
    paginationPageSize: number,
    datasource: IServerSideDatasource | undefined,
    quickFilterText: string | undefined,
    datasourceOnFail: ((err: unknown) => void) | undefined,
): React.ComponentProps<typeof AgGridReact<Data>> => {
    if (rowModelType === 'clientSide') {
        return { rowModelType, rowData, pagination: true, paginationPageSize };
    }

    if (rowModelType === 'serverSide') {
        return {
            rowModelType,
            serverSideDatasource: datasource ?? getDatasource(template, quickFilterText, datasourceOnFail),
            cacheBlockSize: 50,
            maxBlocksInCache: 10,
            pagination: true,
            paginationPageSize,
        };
    }

    return {
        rowModelType,
        pagination: false,
        serverSideDatasource: datasource ?? getDatasource(template, quickFilterText, datasourceOnFail),
        cacheBlockSize: 50,
        maxBlocksInCache: 10,
        maxConcurrentDatasourceRequests: 1,
        infiniteInitialRowCount: 50,
    };
};

export type EntitiesTableOfTemplateProps<Data> = {
    template: IMongoEntityTemplatePopulated;
    onRowSelected?: (data: Data) => void;
    showNavigateToRowButton: boolean;
    deleteRowButtonProps?: {
        onClick: (data: Data) => void;
        popoverText: string;
        disabled: boolean;
    };
    editRowButtonProps?: {
        onClick: (data: Data) => void;
    };
    disabledEntity?: boolean;
    getRowId: (data: Data) => string;
    getEntityPropertiesData: (data: Data) => IEntity['properties'];
    rowModelType: 'serverSide' | 'clientSide' | 'infinite';
    rowData?: Data[];
    datasource?: IServerSideDatasource;
    quickFilterText?: string;
    rowHeight: number;
    pageRowCount?: number;
    fontSize: React.CSSProperties['fontSize'];
    minColumnWidth: number;
    hideNonPreview?: boolean;
    filterStorageProps: { shouldSaveFilter: boolean; pageType?: string };
    onFilter?: () => void;
};

export type EntitiesTableOfTemplateRef<Data> = {
    getExcelData: () => string | undefined;
    resetFilter: () => void;
    refreshServerSide: () => void;
    updateRowDataClientSide: (data: Data) => void;
    isFiltered: () => boolean;
    getFilterModel: () => ReturnType<GridApi<Data>['getFilterModel']>;
    getSortModel: () => IServerSideGetRowsRequest['sortModel'];
};

const EntitiesTableOfTemplate = forwardRef<EntitiesTableOfTemplateRef<unknown>, EntitiesTableOfTemplateProps<unknown>>(
    <Data extends any>(
        {
            template,
            onRowSelected,
            showNavigateToRowButton,
            disabledEntity,
            getRowId,
            getEntityPropertiesData,
            rowModelType,
            deleteRowButtonProps,
            editRowButtonProps,
            rowData,
            datasource,
            quickFilterText,
            rowHeight,
            pageRowCount = rowCount,
            fontSize,
            minColumnWidth,
            hideNonPreview,
            filterStorageProps,
            onFilter,
        }: EntitiesTableOfTemplateProps<Data>,
        ref: ForwardedRef<EntitiesTableOfTemplateRef<Data>>,
    ) => {
        const navigate = useNavigate();

        const gridRef = useRef<AgGridReact<Data>>(null);

        useImperativeHandle(ref, () => {
            return {
                getExcelData() {
                    return gridRef.current?.api.getSheetDataForExcel({ sheetName: template.displayName });
                },
                resetFilter() {
                    gridRef.current?.api.setFilterModel(defaultFilterModel);
                },
                refreshServerSide() {
                    gridRef.current?.api.refreshServerSide({ purge: true });
                },
                updateRowDataClientSide(data: Data) {
                    gridRef.current?.api.forEachNode((rowNode) => {
                        if (rowNode.data && getRowId(data) === getRowId(rowNode.data)) {
                            rowNode.updateData(data);
                        }
                    });
                },
                isFiltered() {
                    const filters = gridRef.current?.api.getFilterModel();
                    return !filters || !isEqual(filters, defaultFilterModel);
                },
                getFilterModel() {
                    return gridRef.current!.api.getFilterModel();
                },
                getSortModel() {
                    const colState = gridRef.current!.columnApi.getColumnState();
                    return colState.filter((s) => Boolean(s.sort)).map((s) => ({ colId: s.colId, sort: s.sort! }))!;
                },
            };
        });
        const columnDefs: ColDef[] = getColumnDefs({
            template,
            getEntityPropertiesData,
            onNavigateToRow: !showNavigateToRowButton ? undefined : (data) => navigate(`/entity/${getEntityPropertiesData(data)._id}`),
            disabledEntity,
            deleteRowButtonProps,
            hideNonPreview,
            editRowButtonProps,
        });

        const datasourceOnFail = (err: unknown) => {
            toast.error(i18next.t('entitiesTableOfTemplate.failedToLoadData'));
            // eslint-disable-next-line no-console
            console.log('failed to load data from datasource. err:', err);
        };

        // useMemo because on SSRM if datasource prop changes it reloads rows (because maybe getRows is changed)
        // because we recreate datasource object on every irrelevant render, we recreate only on dependencies
        // usually only quickFilterText changes on deps
        const rowModelProps = useMemo(
            () => getRowModelProps(rowModelType, template, rowData, pageRowCount, datasource, quickFilterText, datasourceOnFail),
            [rowModelType, template, rowData, pageRowCount, datasource, quickFilterText],
        );

        const getStyles = () => ({
            '.ag-column-select-virtual-list-viewport': { height: `${rowHeight * pageRowCount}px !important` },
            '.ag-center-cols-clipper': { minHeight: `${rowHeight * pageRowCount}px !important` },
        });

        return (
            <Box sx={getStyles()}>
                <AgGridReact<Data>
                    ref={gridRef}
                    getRowStyle={(params) => {
                        if (params.data && getEntityPropertiesData(params.data).disabled) return { background: 'rgb(159 147 147 / 16%)' };
                        return { background: 'default' };
                    }}
                    className="ag-theme-material"
                    containerStyle={{
                        width: '100%',
                        height: rowModelType === 'infinite' ? `${rowHeight * pageRowCount}px` : undefined,
                        fontFamily: 'Rubik',
                        fontSize,
                        fontWeight: 300,
                    }}
                    modules={[ServerSideRowModelModule, ColumnsToolPanelModule, MenuModule, SetFilterModule, ClientSideRowModelModule]}
                    domLayout={rowModelType !== 'infinite' ? 'autoHeight' : undefined}
                    getRowId={({ data }) => getRowId(data)}
                    columnDefs={columnDefs}
                    {...rowModelProps}
                    rowHeight={rowHeight}
                    components={{
                        agDateInput: DateFilterComponent,
                    }}
                    enableRtl
                    enableCellTextSelection
                    rowSelection={onRowSelected ? 'single' : undefined}
                    onRowSelected={!onRowSelected ? undefined : ({ data }) => onRowSelected(data!)}
                    rowStyle={onRowSelected ? { cursor: 'pointer' } : undefined}
                    suppressCellFocus
                    onFilterChanged={(params) => {
                        onFilter?.();
                        if (filterStorageProps.shouldSaveFilter) {
                            const filterModel = params.api.getFilterModel();
                            if (isEqual(filterModel, defaultFilterModel)) {
                                LocalStorage.remove(`tableFilter-${filterStorageProps.pageType}-${template._id}`);
                            } else {
                                LocalStorage.set(
                                    `tableFilter-${filterStorageProps.pageType}-${template._id}`,
                                    pickBy(filterModel, (_value, key) => key !== 'disabled'),
                                );
                            }
                        }
                    }}
                    suppressCsvExport
                    suppressContextMenu
                    onGridReady={(params) => {
                        params.api.setFilterModel({
                            ...defaultFilterModel,
                            ...LocalStorage.get(`tableFilter-${filterStorageProps.pageType}-${template._id}`),
                        });
                    }}
                    defaultColDef={{
                        filterParams: {
                            suppressAndOrCondition: true,
                            buttons: ['reset'],
                        },
                        sortable: true,
                        menuTabs: ['filterMenuTab'],
                        minWidth: minColumnWidth,
                        resizable: true,
                        flex: 1,
                    }}
                    sideBar={{
                        toolPanels: [
                            {
                                id: 'columns',
                                labelDefault: 'Columns',
                                labelKey: 'columns',
                                iconKey: 'columns',
                                toolPanel: 'agColumnsToolPanel',
                                toolPanelParams: {
                                    suppressRowGroups: true,
                                    suppressValues: true,
                                    suppressPivotMode: true,
                                },
                            },
                        ],
                        position: 'left',
                    }}
                    localeText={i18next.t('agGridLocaleText', { returnObjects: true })}
                />
            </Box>
        );
    },
);

// forwardRef loses generic type of component. see https://stackoverflow.com/questions/58469229/react-with-typescript-generics-while-using-react-forwardref
export default EntitiesTableOfTemplate as <Data = IEntity>(
    props: EntitiesTableOfTemplateProps<Data> & { ref?: React.ForwardedRef<EntitiesTableOfTemplateRef<Data>> },
) => ReturnType<typeof EntitiesTableOfTemplate>;
