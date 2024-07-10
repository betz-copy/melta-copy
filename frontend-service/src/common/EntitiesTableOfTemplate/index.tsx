import React, { forwardRef, ForwardedRef, useImperativeHandle, useRef, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import sortBy from 'lodash.sortby';
import { Box } from '@mui/material';
import pickBy from 'lodash.pickby';
import isEqual from 'lodash.isequal';
import {
    ColumnMovedEvent,
    ColumnResizedEvent,
    ColumnVisibleEvent,
    GridApi,
    IServerSideDatasource,
    IServerSideGetRowsParams,
    IServerSideGetRowsRequest,
    PaginationChangedEvent,
} from '@ag-grid-community/core';
import { AgGridReact } from '@ag-grid-community/react';
import '@noam7700/ag-grid-enterprise-core';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import { ColumnsToolPanelModule } from '@noam7700/ag-grid-enterprise-column-tool-panel';
import { StatusBarModule } from '@noam7700/ag-grid-enterprise-status-bar';
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
import { IGetColumnDefsOptions, getColumnDefs } from './getColumnDefs';
import { trycatch } from '../../utils/trycatch';
import { LocalStorage } from '../../utils/localStorage';
import { environment } from '../../globals';
import useDeepCompareMemo from '../../utils/useDeepCompareMemo';
import { ResizeBox } from '../EntitiesPage/ResizeBox';
import '../../css/resizeTable.css';
import { RowCountGridStatusBar } from '../EntitiesPage/RowCountGridStatusBar';

const { rowCount, defaultExpandedRowCount } = environment.agGrid;

export const defaultFilterModel = {
    disabled: {
        filterType: 'set',
        values: ['false'],
    },
};

export interface IButtonProps<Data> {
    onClick: (entity: Data) => void;
    popoverText: string;
    disabledButton: boolean;
}
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
            console.log({ data });

            params.success({ rowData: data.entities.map(({ entity }) => entity), rowCount: data.count });
        },
    };
};

const getRowModelProps = <Data extends any = IEntity>(
    rowModelType: 'serverSide' | 'clientSide' | 'infinite',
    template: IMongoEntityTemplatePopulated,
    rowData: Data[] | undefined,
    paginationPageSize: number,
    quickFilterText: string | undefined,
    datasourceOnFail: ((err: unknown) => void) | undefined,
): React.ComponentProps<typeof AgGridReact<Data>> => {
    console.log({ rowData });

    if (rowModelType === 'clientSide') {
        return { rowModelType, rowData, pagination: true, paginationPageSize };
    }

    if (rowModelType === 'serverSide') {
        return {
            rowModelType,
            serverSideDatasource: getDatasource(template, quickFilterText, datasourceOnFail),
            cacheBlockSize: 50,
            maxBlocksInCache: 10,
            pagination: true,
            paginationPageSize,
        };
    }
    return {
        // the serverSide includes advanced infinite row model
        rowModelType: 'serverSide',
        pagination: false,
        serverSideDatasource: getDatasource(template, quickFilterText, datasourceOnFail),
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
    deleteRowButtonProps?: IButtonProps<Data>;
    editRowButtonProps?: IButtonProps<Data>;
    hasPermissionToCategory?: boolean;
    getRowId: (data: Data) => string;
    getEntityPropertiesData: (data: Data) => IEntity['properties'];
    rowModelType: 'serverSide' | 'clientSide' | 'infinite';
    rowData?: Data[];
    quickFilterText?: string;
    rowHeight: number;
    pageRowCount?: number;
    fontSize: React.CSSProperties['fontSize'];
    hideNonPreview?: boolean;
    saveStorageProps: {
        shouldSaveFilter: boolean;
        shouldSaveWidth: boolean;
        shouldSaveVisibleColumns: boolean;
        shouldSaveSorting: boolean;
        shouldSaveColumnOrder: boolean;
        shouldSavePagination: boolean;
        pageType?: string;
    };
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
    showSideBar: () => void;
};

const EntitiesTableOfTemplate = forwardRef<EntitiesTableOfTemplateRef<unknown>, EntitiesTableOfTemplateProps<unknown>>(
    <Data extends any>(
        {
            template,
            onRowSelected,
            showNavigateToRowButton,
            getRowId,
            getEntityPropertiesData,
            rowModelType,
            deleteRowButtonProps,
            editRowButtonProps,
            rowData,
            quickFilterText,
            rowHeight,
            pageRowCount = rowCount,
            fontSize,
            hideNonPreview,
            saveStorageProps,
            onFilter,
            hasPermissionToCategory,
        }: EntitiesTableOfTemplateProps<Data>,
        ref: ForwardedRef<EntitiesTableOfTemplateRef<Data>>,
    ) => {
        const savedVisibleColumns = localStorage.getItem(`visibleColumns-${saveStorageProps.pageType}-${template._id}`);
        const defaultVisibleColumns = savedVisibleColumns ? JSON.parse(savedVisibleColumns) : {};

        const saveColumnsOrder = localStorage.getItem(`columnsOrder-${saveStorageProps.pageType}-${template._id}`);
        const defaultColumnsOrder = saveColumnsOrder ? JSON.parse(saveColumnsOrder) : {};

        const savedColumnWidths = localStorage.getItem(`columnWidths-${saveStorageProps.pageType}-${template._id}`);
        const defaultColumnWidths = savedColumnWidths ? JSON.parse(savedColumnWidths) : {};

        const navigate = useNavigate();

        const gridRef = useRef<AgGridReact<Data>>(null);
        // height of table includes statusbar and titles
        const minHeightTable = rowHeight * pageRowCount + rowHeight * 2;
        const [gridHeight, setGridHeight] = useState<number>(rowHeight * defaultExpandedRowCount);

        const getSortModel = () => {
            const colState = gridRef.current!.columnApi.getColumnState();
            return sortBy(
                colState.filter((s) => Boolean(s.sort)),
                (c) => c.sortIndex,
            ).map((s) => ({ colId: s.colId, sort: s.sort! }))!;
        };

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
                        console.log({ data });
                        console.log({ rowNode });

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
                    return getSortModel();
                },
                showSideBar() {
                    const sideBarOpen = gridRef.current?.api.isToolPanelShowing();
                    gridRef.current?.api.setSideBarVisible(!sideBarOpen);
                    if (sideBarOpen) gridRef.current?.api.closeToolPanel();
                    else gridRef.current?.api.openToolPanel('columns');
                },
            };
        });

        const columnDefProps: IGetColumnDefsOptions<Data> = {
            template,
            getEntityPropertiesData,
            onNavigateToRow: !showNavigateToRowButton ? undefined : (data) => navigate(`/entity/${getEntityPropertiesData(data)._id}`),
            deleteRowButtonProps,
            hideNonPreview,
            editRowButtonProps,
            hasPermissionToCategory,
            defaultVisibleColumns,
            defaultColumnsOrder,
            defaultColumnWidths,
            rowHeight,
        };

        const columnDefs = useDeepCompareMemo(() => getColumnDefs(columnDefProps), [columnDefProps]);

        const datasourceOnFail = (err: unknown) => {
            toast.error(i18next.t('entitiesTableOfTemplate.failedToLoadData'));
            // eslint-disable-next-line no-console
            console.log('failed to load data from datasource. err:', err);
        };

        // useMemo because on SSRM if datasource prop changes it reloads rows (because maybe getRows is changed)
        // because we recreate datasource object on every irrelevant render, we recreate only on dependencies
        // usually only quickFilterText changes on deps
        const rowModelProps = useMemo(
            () => getRowModelProps(rowModelType, template, rowData, pageRowCount, quickFilterText, datasourceOnFail),
            [rowModelType, template, rowData, pageRowCount, quickFilterText],
        );
        const getStyles = () => ({
            '.ag-column-select-virtual-list-viewport': { height: `${rowHeight * pageRowCount}px !important` },
            '.ag-center-cols-clipper': { minHeight: `${rowHeight * pageRowCount}px !important` },
            '.ag-paging-panel': {
                height: '45px',
            },
            '.ag-paging-panel > *': { fontSize: '15px' },
        });

        // function save to localStorage:

        // visibility of columns
        const onColumnVisible = (params: ColumnVisibleEvent<Data>) => {
            if (!saveStorageProps.shouldSaveVisibleColumns) return;
            const columnState = params.columnApi.getColumnState();
            const updatedVisibleColumns = columnState.reduce((acc, col) => {
                // eslint-disable-next-line no-param-reassign
                acc[col.colId] = col.hide === false;
                return acc;
            }, {});
            localStorage.setItem(`visibleColumns-${saveStorageProps.pageType}-${template._id}`, JSON.stringify(updatedVisibleColumns));
        };

        // order of columns
        const onColumnMoved = (params: ColumnMovedEvent<Data>) => {
            if (!saveStorageProps.shouldSaveColumnOrder) return;
            const columnState = params.columnApi.getColumnState();
            const newcolumnsOrder = columnState.reduce((acc, column, index) => {
                // eslint-disable-next-line no-param-reassign
                acc[column.colId] = { order: index };
                return acc;
            }, {});
            localStorage.setItem(`columnsOrder-${saveStorageProps.pageType}-${template._id}`, JSON.stringify(newcolumnsOrder));
        };

        // width of columns
        const onColumnResized = (params: ColumnResizedEvent<Data>) => {
            if (
                params.finished &&
                // only when change was done on single column, and the cause is user resizing deliberately (mouse clicking)
                params.column &&
                (params.source === 'autosizeColumns' || params.source === 'uiColumnDragged' || params.source === 'uiColumnResized')
            ) {
                const currColumnWidths = localStorage.getItem(`columnWidths-${saveStorageProps.pageType}-${template._id}`);
                const currColumnWidthsParsed = currColumnWidths ? JSON.parse(currColumnWidths) : {};
                localStorage.setItem(
                    `columnWidths-${saveStorageProps.pageType}-${template._id}`,
                    JSON.stringify({ ...currColumnWidthsParsed, [params.column.getColId()]: params.column.getActualWidth() }),
                );
            }
        };

        // sorting Column
        const onSortChanged = () => {
            if (!saveStorageProps.shouldSaveSorting) return;
            const sortModel = getSortModel();
            localStorage.setItem(`sortModel-${saveStorageProps.pageType}-${template._id}`, JSON.stringify(sortModel));
        };

        // page in table - sessionStorage
        const onPaginationChanged = (params: PaginationChangedEvent<Data>) => {
            if (!saveStorageProps.shouldSavePagination) return;

            if (params.api && params.newPage) {
                const currentPage = params.api.paginationGetCurrentPage();
                sessionStorage.setItem(`currentPage-${saveStorageProps.pageType}-${template._id}`, JSON.stringify(currentPage));
            }
        };

        const gridContent = (
            <Box
                sx={getStyles()}
                style={{
                    borderRadius: '10px',
                    boxShadow: '-2px 2px 6px 0px rgba(30, 39, 117, 0.30)',
                }}
            >
                <AgGridReact<Data>
                    ref={gridRef}
                    getRowStyle={(params) => {
                        if (params.data && getEntityPropertiesData(params.data).disabled) {
                            return { background: '#FAFAFA', color: 'rgb(159 147 147 / 40%)' };
                        }
                        return { background: 'default', color: 'default' };
                    }}
                    className="ag-theme-material"
                    containerStyle={{
                        width: '100%',
                        height: rowModelType === 'infinite' ? `${gridHeight}px` : undefined,
                        fontFamily: 'Rubik',
                        fontSize,
                        fontWeight: 300,
                    }}
                    modules={[
                        ServerSideRowModelModule,
                        ColumnsToolPanelModule,
                        MenuModule,
                        SetFilterModule,
                        ClientSideRowModelModule,
                        StatusBarModule,
                    ]}
                    domLayout={rowModelType !== 'infinite' ? 'autoHeight' : undefined}
                    getRowId={({ data }) => getRowId(data)}
                    columnDefs={columnDefs}
                    {...rowModelProps}
                    rowHeight={rowHeight}
                    components={{
                        agDateInput: DateFilterComponent,
                    }}
                    onColumnVisible={onColumnVisible}
                    onColumnMoved={onColumnMoved}
                    onColumnResized={onColumnResized}
                    onPaginationChanged={onPaginationChanged}
                    onSortChanged={onSortChanged}
                    enableRtl
                    enableCellTextSelection
                    maintainColumnOrder
                    rowSelection={onRowSelected ? 'single' : undefined}
                    onRowSelected={!onRowSelected ? undefined : ({ data }) => onRowSelected(data!)}
                    rowStyle={onRowSelected ? { cursor: 'pointer' } : undefined}
                    suppressCellFocus
                    onFilterChanged={(params) => {
                        onFilter?.();
                        if (saveStorageProps.shouldSaveFilter) {
                            const filterModel = params.api.getFilterModel();
                            if (isEqual(filterModel, defaultFilterModel)) {
                                LocalStorage.remove(`tableFilter-${saveStorageProps.pageType}-${template._id}`);
                            } else {
                                LocalStorage.set(
                                    `tableFilter-${saveStorageProps.pageType}-${template._id}`,
                                    pickBy(filterModel, (_value, key) => key !== 'disabled'),
                                );
                            }
                        }
                    }}
                    suppressCsvExport
                    suppressContextMenu
                    onGridReady={(params) => {
                        gridRef.current?.api.setSideBarVisible(false);
                        params.api.setFilterModel({
                            ...defaultFilterModel,
                            ...LocalStorage.get(`tableFilter-${saveStorageProps.pageType}-${template._id}`),
                        });
                        const savedSortModel = localStorage.getItem(`sortModel-${saveStorageProps.pageType}-${template._id}`);
                        if (savedSortModel) {
                            const sortModel: IServerSideGetRowsRequest['sortModel'] = JSON.parse(savedSortModel);
                            params.columnApi.applyColumnState({
                                state: sortModel.map((s, i) => ({ ...s, sortIndex: i })),
                                defaultState: { sort: null },
                            });
                        }
                    }}
                    onFirstDataRendered={(params) => {
                        const savedPage = sessionStorage.getItem(`currentPage-${template._id}`);
                        if (savedPage !== null) {
                            const pageToNavigate = JSON.parse(savedPage);
                            params.api.paginationGoToPage(pageToNavigate);
                        }
                    }}
                    defaultColDef={{
                        filterParams: {
                            suppressAndOrCondition: true,
                            buttons: ['reset'],
                        },
                        sortable: true,
                        menuTabs: ['filterMenuTab'],
                        minWidth: 120,
                        resizable: true,
                        lockPinned: true,
                        initialWidth: 250,
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
                    statusBar={
                        rowModelType === 'infinite'
                            ? {
                                  statusPanels: [
                                      {
                                          statusPanel: RowCountGridStatusBar,
                                          align: 'right',
                                      },
                                  ],
                              }
                            : undefined
                    }
                    localeText={i18next.t('agGridLocaleText', { returnObjects: true })}
                />
            </Box>
        );

        return rowModelType === 'infinite' ? (
            <ResizeBox initialHeight={gridHeight} setHeight={setGridHeight} minHeight={minHeightTable}>
                {gridContent}
            </ResizeBox>
        ) : (
            gridContent
        );
    },
);

// forwardRef loses generic type of component. see https://stackoverflow.com/questions/58469229/react-with-typescript-generics-while-using-react-forwardref
export default EntitiesTableOfTemplate as <Data = IEntity>(
    props: EntitiesTableOfTemplateProps<Data> & { ref?: React.ForwardedRef<EntitiesTableOfTemplateRef<Data>> },
) => ReturnType<typeof EntitiesTableOfTemplate>;
