/* eslint-disable no-param-reassign */
import {
    BodyScrollEvent,
    ColumnMovedEvent,
    ColumnResizedEvent,
    ColumnVisibleEvent,
    GridApi,
    IServerSideDatasource,
    IServerSideGetRowsParams,
    IServerSideGetRowsRequest,
    PaginationChangedEvent,
    RowStyle,
} from '@ag-grid-community/core';
import { AgGridReact } from '@ag-grid-community/react';
import { Box, CircularProgress, debounce } from '@mui/material';
import i18next from 'i18next';
import isEqual from 'lodash.isequal';
import pickBy from 'lodash.pickby';
import sortBy from 'lodash.sortby';
import React, { ForwardedRef, forwardRef, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { useLocation } from 'wouter';
import '../../css/resizeTable.css';
import '../../css/table.css';
import { environment } from '../../globals';
import { IEntity, IEntityExpanded } from '../../interfaces/entities';
import { IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import { IRelationship } from '../../interfaces/relationships';
import { searchEntitiesOfTemplateRequest } from '../../services/entitiesService';
import { useDarkModeStore } from '../../stores/darkMode';
import { agGridLocaleText } from '../../utils/agGrid/agGridLocaleText';
import { agGridToSearchEntitiesOfTemplateRequest } from '../../utils/agGrid/agGridToSearchEntitiesOfTemplateRequest';
import { DateFilterComponent } from '../../utils/agGrid/DateFilterComponent';
import { IAGGridRequest } from '../../utils/agGrid/interfaces';
import useDeepCompareMemo from '../../utils/hooks/useDeepCompareMemo';
import { LocalStorage } from '../../utils/localStorage';
import { trycatch } from '../../utils/trycatch';
import { ResizeBox } from '../EntitiesPage/ResizeBox';
import { RowCountGridStatusBar } from '../EntitiesPage/RowCountGridStatusBar';
import { getColumnDefs, IGetColumnDefsOptions } from './getColumnDefs';

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
    quickFilterText?: string,
    onFail?: (err: unknown) => void,
    rowData?: IConnection[],
): IServerSideDatasource => {
    return {
        async getRows(params: IServerSideGetRowsParams<Data>) {
            if (rowData) {
                params.success({
                    rowData,
                    rowCount: rowData.length,
                });
                return;
            }

            const agGridRequest = { ...params.request, filterModel: { ...defaultFilterModel, ...params.request.filterModel } };
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

            params.success({
                rowData: data.entities.map(({ entity }) => entity as Data),
                rowCount: data.count,
            });
        },
    };
};

export type IConnection = {
    relationship: Pick<IRelationship, 'properties' | 'templateId'>;
    sourceEntity: IEntity;
    destinationEntity: IEntity;
};

export const getRowModelProps = <Data extends any = IEntity>(
    rowModelType: 'serverSide' | 'clientSide' | 'infinite',
    template: IMongoEntityTemplatePopulated,
    rowData: Data[] | undefined,
    paginationPageSize: number,
    quickFilterText?: string,
    datasourceOnFail?: (err: unknown) => void,
    hasInstances?: boolean,
): React.ComponentProps<typeof AgGridReact<Data>> => {
    if (rowModelType === 'clientSide') {
        return {
            rowModelType,
            rowData,
            pagination: hasInstances ?? true,
            paginationPageSize,
        };
    }

    const { cacheBlockSize, maxConcurrentDatasourceRequests } = environment.agGrid;

    return {
        rowModelType: 'serverSide',
        serverSideDatasource: getDatasource<IConnection>(template, quickFilterText, datasourceOnFail, rowData as IConnection[]),
        cacheBlockSize: rowModelType === 'serverSide' ? cacheBlockSize : undefined,
        pagination: rowModelType === 'serverSide',
        paginationPageSize,
        maxConcurrentDatasourceRequests,
    };
};

const LoadingCellRenderer = () => <CircularProgress size={20} sx={{ marginLeft: 1 }} />;

export type EntitiesTableOfTemplateProps<Data> = {
    template: IMongoEntityTemplatePopulated & { entitiesWithFiles?: string[] };
    entities?: Data[];
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
        shouldSaveScrollPosition: boolean;
        pageType?: string;
    };
    onFilter?: () => void;
    mainEntity?: IEntityExpanded;
    hasInstances?: boolean;
    paginationPageSizeSelector?: boolean | number[];
};

export type EntitiesTableOfTemplateRef<Data> = {
    getExcelData: () => string | undefined;
    resetFilter: () => void;
    refreshServerSide: () => void;
    updateRowDataClientSide: (data: Data) => void;
    isFiltered: () => boolean;
    getFilterModel: () => ReturnType<GridApi<Data>['getFilterModel']>;
    getSortModel: () => IServerSideGetRowsRequest['sortModel'];
    scrollIntoView: () => void;
    showSideBar: () => void;
    getDisplayColumns: () => string[];
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
            mainEntity,
            hasInstances,
            paginationPageSizeSelector = environment.agGrid.paginationPageSizeSelector as unknown as number[],
        }: EntitiesTableOfTemplateProps<Data>,
        ref: ForwardedRef<EntitiesTableOfTemplateRef<Data>>,
    ) => {
        const darkMode = useDarkModeStore((state) => state.darkMode);
        const savedVisibleColumns = localStorage.getItem(`visibleColumns-${saveStorageProps.pageType}-${template._id}`);
        const defaultVisibleColumns = savedVisibleColumns ? JSON.parse(savedVisibleColumns) : {};

        const savedColumnsOrder = localStorage.getItem(`columnsOrder-${saveStorageProps.pageType}-${template._id}`);
        const defaultColumnsOrder = savedColumnsOrder ? JSON.parse(savedColumnsOrder) : {};

        const savedColumnWidths = localStorage.getItem(`columnWidths-${saveStorageProps.pageType}-${template._id}`);
        const defaultColumnWidths = savedColumnWidths ? JSON.parse(savedColumnWidths) : {};

        const [_, navigate] = useLocation();

        const gridRef = useRef<AgGridReact<Data>>(null);
        const tableRef = useRef<HTMLDivElement>(null);

        const minHeightTable = rowHeight * pageRowCount + rowHeight * 2;
        const [gridHeight, setGridHeight] = useState<number>(rowHeight * defaultExpandedRowCount);

        const getSortModel = () => {
            const colState = gridRef.current!.api.getColumnState();
            return sortBy(
                colState.filter((s) => Boolean(s.sort)),
                (c) => c.sortIndex,
            ).map((s) => ({ colId: s.colId, sort: s.sort! }))!;
        };

        useImperativeHandle(ref, () => ({
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
                return getSortModel();
            },
            scrollIntoView() {
                tableRef.current?.scrollIntoView({ behavior: 'smooth' });
            },
            showSideBar() {
                const gridApi = gridRef.current?.api;
                if (!gridApi) return;
                const isSideBarOpen = gridApi.isToolPanelShowing();
                gridApi.setSideBarVisible(!isSideBarOpen);
                if (isSideBarOpen) {
                    gridApi.closeToolPanel();
                } else {
                    gridApi.openToolPanel('columns');
                }
            },
            getDisplayColumns: () => gridRef.current?.api.getAllDisplayedColumns().map((column) => column.getColId()) || [],
        }));

        const columnDefProps: IGetColumnDefsOptions<Data> = {
            template,
            getEntityPropertiesData,
            onNavigateToRow: showNavigateToRowButton ? (data) => navigate(`/entity/${getEntityPropertiesData(data)._id}`) : undefined,
            deleteRowButtonProps,
            hideNonPreview,
            editRowButtonProps,
            hasPermissionToCategory,
            defaultVisibleColumns,
            defaultColumnsOrder,
            defaultColumnWidths,
            rowHeight,
            searchValue: quickFilterText,
        };
        const columnDefs = useDeepCompareMemo(() => getColumnDefs(columnDefProps), [columnDefProps]);

        const datasourceOnFail = (err: unknown) => {
            toast.error(i18next.t('entitiesTableOfTemplate.failedToLoadData'));
            console.error('Failed to load data from datasource. Error:', err);
        };

        const rowModelProps = useMemo(
            () => getRowModelProps(rowModelType, template, rowData, pageRowCount, quickFilterText, datasourceOnFail, hasInstances),
            [rowModelType, template, rowData, pageRowCount, quickFilterText, mainEntity, hasInstances],
        );

        const gridStyles = {
            '.ag-center-cols-viewport': {
                minHeight: `${rowHeight * (hasInstances ? pageRowCount : 2)}px !important`,
            },
            '.ag-paging-panel': {
                height: '45px',
            },
            '.ag-paging-panel > *': { fontSize: '15px' },
        };

        const handleColumnVisible = (params: ColumnVisibleEvent<Data>) => {
            if (!saveStorageProps.shouldSaveVisibleColumns) return;
            const columnState = params.api.getColumnState();
            const updatedVisibleColumns = columnState.reduce<Record<string, boolean>>((acc, col) => {
                acc[col.colId] = !col.hide;
                return acc;
            }, {});
            localStorage.setItem(`visibleColumns-${saveStorageProps.pageType}-${template._id}`, JSON.stringify(updatedVisibleColumns));
        };

        const handleColumnMoved = (params: ColumnMovedEvent<Data>) => {
            if (!saveStorageProps.shouldSaveColumnOrder) return;
            const columnState = params.api.getColumnState();
            const newColumnsOrder = columnState.reduce<Record<string, { order: number }>>((acc, column, index) => {
                acc[column.colId] = { order: index };
                return acc;
            }, {});
            localStorage.setItem(`columnsOrder-${saveStorageProps.pageType}-${template._id}`, JSON.stringify(newColumnsOrder));
        };

        const handleColumnResized = (params: ColumnResizedEvent<Data>) => {
            if (params.finished && params.column && ['autosizeColumns', 'uiColumnDragged', 'uiColumnResized'].includes(params.source)) {
                const currColumnWidths = localStorage.getItem(`columnWidths-${saveStorageProps.pageType}-${template._id}`);
                const currColumnWidthsParsed = currColumnWidths ? JSON.parse(currColumnWidths) : {};
                localStorage.setItem(
                    `columnWidths-${saveStorageProps.pageType}-${template._id}`,
                    JSON.stringify({
                        ...currColumnWidthsParsed,
                        [params.column.getColId()]: params.column.getActualWidth(),
                    }),
                );
            }
        };

        const handleSortChanged = () => {
            if (!saveStorageProps.shouldSaveSorting) return;
            const sortModel = getSortModel();
            localStorage.setItem(`sortModel-${saveStorageProps.pageType}-${template._id}`, JSON.stringify(sortModel));
        };

        const handlePaginationChanged = (params: PaginationChangedEvent<Data>) => {
            if (!saveStorageProps.shouldSavePagination) return;
            if (params.api && params.newPage) {
                const currentPage = params.api.paginationGetCurrentPage();
                sessionStorage.setItem(`currentPage-${saveStorageProps.pageType}-${template._id}`, JSON.stringify(currentPage));
            }
        };

        const handleBodyScroll = debounce((params: BodyScrollEvent<Data>) => {
            if (!saveStorageProps.shouldSaveScrollPosition) return;
            if (params.api.getVerticalPixelRange().top >= 0 && rowModelType === 'infinite') {
                sessionStorage.setItem(`scrollPosition-${template._id}`, JSON.stringify(params.api.getVerticalPixelRange().top));
            }
        }, 300);

        const gridContent = (
            <Box
                sx={gridStyles}
                style={{
                    borderRadius: '10px',
                    boxShadow: '-2px 2px 6px 0px rgba(30, 39, 117, 0.30)',
                }}
                ref={tableRef}
            >
                <AgGridReact<Data>
                    ref={gridRef}
                    getRowStyle={(params): RowStyle | undefined => {
                        if (params.data && getEntityPropertiesData(params.data).disabled) {
                            return { background: darkMode ? '' : '#FAFAFA', color: darkMode ? '#7f7f7f' : 'rgb(159 147 147 / 40%)' };
                        }
                        return undefined;
                    }}
                    className={`ag-theme-material${darkMode ? '-dark' : ''}`}
                    containerStyle={{
                        width: '100%',
                        height: rowModelType === 'infinite' ? `${gridHeight}px` : undefined,
                        fontFamily: 'Rubik',
                        fontSize,
                        fontWeight: 300,
                    }}
                    domLayout={rowModelType !== 'infinite' ? 'autoHeight' : undefined}
                    getRowId={({ data }) => getRowId(data)}
                    columnDefs={columnDefs}
                    {...rowModelProps}
                    rowHeight={rowHeight}
                    components={{
                        agDateInput: DateFilterComponent,
                    }}
                    onColumnVisible={handleColumnVisible}
                    onColumnMoved={handleColumnMoved}
                    onColumnResized={handleColumnResized}
                    onPaginationChanged={handlePaginationChanged}
                    onBodyScroll={rowModelType === 'infinite' ? handleBodyScroll : undefined}
                    onSortChanged={handleSortChanged}
                    enableRtl
                    enableCellTextSelection
                    maintainColumnOrder
                    rowSelection={onRowSelected ? 'single' : undefined}
                    onRowSelected={onRowSelected ? ({ data }) => data && onRowSelected(data) : undefined}
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
                    animateRows
                    loadingCellRenderer={LoadingCellRenderer}
                    suppressCsvExport
                    suppressContextMenu
                    onToolPanelVisibleChanged={() => {
                        const gridApi = gridRef.current?.api;
                        if (!gridApi) return;
                        const isSideBarOpen = gridApi.isToolPanelShowing();
                        gridApi.setSideBarVisible(isSideBarOpen);
                    }}
                    onGridReady={(params) => {
                        const savedSortModel = localStorage.getItem(`sortModel-${saveStorageProps.pageType}-${template._id}`);
                        if (savedSortModel) {
                            const sortModel: IServerSideGetRowsRequest['sortModel'] = JSON.parse(savedSortModel);
                            params.api.applyColumnState({
                                state: sortModel.map((s, i) => ({ ...s, sortIndex: i })),
                                defaultState: { sort: null },
                            });
                        }

                        const savedFilterModel = LocalStorage.get(`tableFilter-${saveStorageProps.pageType}-${template._id}`);
                        if (savedFilterModel) params.api.setFilterModel({ ...savedFilterModel });
                    }}
                    onFirstDataRendered={(params) => {
                        const savedPage = sessionStorage.getItem(`currentPage-${saveStorageProps.pageType}-${template._id}`);

                        if (savedPage !== null) {
                            const pageToNavigate = JSON.parse(savedPage);
                            params.api.paginationGoToPage(pageToNavigate);
                        }

                        if (rowModelType === 'infinite') {
                            const savedRowIndex = sessionStorage.getItem(`scrollPosition-${template._id}`);

                            if (savedRowIndex != null) {
                                const lastScrollPosition = JSON.parse(savedRowIndex);

                                const rowIndex = Math.floor(lastScrollPosition / rowHeight);
                                setTimeout(() => {
                                    params.api.ensureIndexVisible(rowIndex, 'top');
                                    const displayedRow = params.api.getDisplayedRowAtIndex(rowIndex);
                                    if (displayedRow?.rowTop != null) {
                                        const gridBody = document.querySelector('.ag-body-viewport');
                                        if (gridBody) {
                                            gridBody.scrollTo({
                                                top: lastScrollPosition,
                                                behavior: 'smooth',
                                            });
                                        }
                                    }
                                }, 150);
                            }
                        }
                    }}
                    defaultColDef={{
                        filterParams: {
                            maxNumConditions: 1,
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
                        hiddenByDefault: true,
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
                    localeText={agGridLocaleText}
                    paginationPageSizeSelector={paginationPageSizeSelector}
                />
            </Box>
        );

        return rowModelType === 'infinite' ? (
            <ResizeBox initialHeight={gridHeight} setHeight={setGridHeight} minHeight={minHeightTable} templateId={template._id}>
                {gridContent}
            </ResizeBox>
        ) : (
            gridContent
        );
    },
);

export default EntitiesTableOfTemplate as <Data = IEntity>(
    props: EntitiesTableOfTemplateProps<Data> & { ref?: React.ForwardedRef<EntitiesTableOfTemplateRef<Data>> },
) => ReturnType<typeof EntitiesTableOfTemplate>;
