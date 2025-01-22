/* eslint-disable no-param-reassign */
/* eslint-disable no-case-declarations */
import React, { ForwardedRef, forwardRef, useImperativeHandle, useMemo, useRef, useState } from 'react';
import {
    BodyScrollEvent,
    CellEditingStoppedEvent,
    ColumnMovedEvent,
    ColumnResizedEvent,
    ColumnVisibleEvent,
    GridApi,
    IServerSideDatasource,
    IServerSideGetRowsParams,
    IServerSideGetRowsRequest,
    PaginationChangedEvent,
    RowSelectionOptions,
    RowStyle,
    StatusPanelDef,
} from '@ag-grid-community/core';
import { AgGridReact } from '@ag-grid-community/react';
import { Box, CircularProgress, debounce } from '@mui/material';
import { AxiosError } from 'axios';
import i18next from 'i18next';
import isEqual from 'lodash.isequal';
import sortBy from 'lodash.sortby';
import { useMutation } from 'react-query';
import { toast } from 'react-toastify';
import { useLocation } from 'wouter';
import '../../css/resizeTable.css';
import '../../css/table.css';

import { environment } from '../../globals';
import { EntityData, IDeleteEntityBody, IEntity, IEntityExpanded, IUniqueConstraint } from '../../interfaces/entities';
import { IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import { IRelationship } from '../../interfaces/relationships';
import { ActionTypes, IAction, IActionPopulated } from '../../interfaces/ruleBreaches/actionMetadata';
import { IBrokenRule, IRuleBreach, IRuleBreachPopulated } from '../../interfaces/ruleBreaches/ruleBreach';
import ActionOnEntityWithRuleBreachDialog from '../../pages/Entity/components/ActionOnEntityWithRuleBreachDialog';
import {
    deleteEntityRequest,
    searchEntitiesOfTemplateRequest,
    updateEntityRequestForMultiple,
    updateEntityStatusRequest,
} from '../../services/entitiesService';
import { useDarkModeStore } from '../../stores/darkMode';
import { agGridLocaleText } from '../../utils/agGrid/agGridLocaleText';
import { agGridToSearchEntitiesOfTemplateRequest } from '../../utils/agGrid/agGridToSearchEntitiesOfTemplateRequest';
import { DateFilterComponent } from '../../utils/agGrid/DateFilterComponent';
import { IAGGridRequest } from '../../utils/agGrid/interfaces';
import useDeepCompareMemo from '../../utils/hooks/useDeepCompareMemo';
import { LocalStorage } from '../../utils/localStorage';
import { trycatch } from '../../utils/trycatch';
import { AreYouSureDialog } from '../dialogs/AreYouSureDialog';
import { EntityWizardValues } from '../dialogs/entity';
import { MultiSelectStatusBar } from '../EntitiesPage/MultiSelectStatusBar';
import { ResizeBox } from '../EntitiesPage/ResizeBox';
import { RowCountGridStatusBar } from '../EntitiesPage/RowCountGridStatusBar';
import { ErrorToast } from '../ErrorToast';
import { useWorkspaceStore } from '../../stores/workspace';
import { ISemanticSearchResult } from '../../interfaces/semanticSearch';
import { getColumnDefs, IGetColumnDefsOptions } from './getColumnDefs';

const { errorCodes } = environment;

export const defaultFilterModel = {
    disabled: {
        filterType: 'set',
        values: ['false'],
    },
};

export interface IButtonPopoverProps<Data> {
    onClick: (entity: Data) => void;
    popoverText: string;
    disabledButton: boolean;
}

export interface IButtonProps<Data> {
    onClick: (e: React.MouseEvent<HTMLButtonElement>, entity: Data) => void;
    disabledButton: boolean;
}

export const getDatasource = <Data extends any = EntityData>(
    template: IMongoEntityTemplatePopulated,
    tableCount: number,
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

            const agGridRequest = { ...params.request, filterModel: { ...params.request.filterModel } };

            const { result: data, err } = await trycatch(() =>
                searchEntitiesOfTemplateRequest(
                    template._id,
                    agGridToSearchEntitiesOfTemplateRequest(
                        { ...agGridRequest, quickFilter: quickFilterText } as IAGGridRequest,
                        template,
                        tableCount,
                    ),
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

export const getRowModelProps = <Data extends any = EntityData>(
    rowModelType: 'serverSide' | 'clientSide' | 'infinite',
    template: IMongoEntityTemplatePopulated,
    rowData: Data[] | undefined,
    paginationPageSize: number,
    tableCount: number,
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
        serverSideDatasource: getDatasource<IConnection>(template, tableCount, quickFilterText, datasourceOnFail, rowData as IConnection[]),
        cacheBlockSize: rowModelType === 'serverSide' ? cacheBlockSize : undefined,
        pagination: rowModelType === 'serverSide',
        paginationPageSize,
        maxConcurrentDatasourceRequests,
    };
};

const LoadingCellRenderer = () => <CircularProgress size={20} sx={{ marginLeft: 1 }} />;

export type EntitiesTableOfTemplateProps<Data> = {
    template: IMongoEntityTemplatePopulated & { entitiesWithFiles?: ISemanticSearchResult[string] };
    entities?: Data[];
    onRowSelected?: (data: Data) => void;
    showNavigateToRowButton: boolean;
    deleteRowButtonProps?: IButtonPopoverProps<Data>;
    editRowButtonProps?: IButtonPopoverProps<Data>;
    menuRowButtonProps?: boolean;
    hasPermissionToCategory?: boolean;
    getRowId: (data: Data) => string;
    getEntityPropertiesData: (data: Data) => Partial<IEntity['properties']>;
    rowModelType: 'serverSide' | 'clientSide' | 'infinite';
    rowData?: Data[];
    quickFilterText?: string;
    rowHeight: number;
    pageRowCount?: number;
    fontSize: React.CSSProperties['fontSize'];
    multipleSelect?: boolean;
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
    ignoreType?: boolean;
    refetch?: () => void;
    hasInstances?: boolean;
    paginationPageSizeSelector?: boolean | number[];
    editable?: boolean;
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
            menuRowButtonProps,
            rowData,
            quickFilterText,
            rowHeight,
            pageRowCount,
            fontSize,
            hideNonPreview,
            saveStorageProps,
            onFilter,
            hasPermissionToCategory,
            ignoreType,
            refetch,
            hasInstances,
            multipleSelect,
            paginationPageSizeSelector = environment.agGrid.paginationPageSizeSelector as unknown as number[],
            editable = true,
        }: EntitiesTableOfTemplateProps<Data>,
        ref: ForwardedRef<EntitiesTableOfTemplateRef<Data>>,
    ) => {
        const [_, navigate] = useLocation();
        const darkMode = useDarkModeStore((state) => state.darkMode);
        const workspace = useWorkspaceStore((state) => state.workspace);
        const { rowCount, defaultExpandedRowCount } = workspace.metadata.agGrid;
        const { table } = workspace.metadata.searchLimits;

        if (!pageRowCount) pageRowCount = rowCount;

        const gridRef = useRef<AgGridReact<Data>>(null);
        const tableRef = useRef<HTMLDivElement>(null);

        const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

        const minHeightTable = rowHeight * pageRowCount + rowHeight * 2;
        const [gridHeight, setGridHeight] = useState<number>(rowHeight * defaultExpandedRowCount);

        const [selectedRow, setSelectedRow] = useState('');
        const [currEntity, setCurrEntity] = useState<IEntity>();
        const [currEditingCell, setCurrEditingCell] = useState<any>();

        const [updateWithRuleBreachDialogState, setUpdateWithRuleBreachDialogState] = useState<{
            isOpen: boolean;
            brokenRules?: IRuleBreachPopulated['brokenRules'];
            rawBrokenRules?: IBrokenRule[];
            updateEntityFormData?: EntityWizardValues;
            actions?: IActionPopulated[];
            rawActions?: IAction[];
        }>({ isOpen: false });

        const savedVisibleColumns = localStorage.getItem(`visibleColumns-${saveStorageProps.pageType}-${template._id}`);
        const defaultVisibleColumns = savedVisibleColumns ? JSON.parse(savedVisibleColumns) : {};

        const savedColumnsOrder = localStorage.getItem(`columnsOrder-${saveStorageProps.pageType}-${template._id}`);
        const defaultColumnsOrder = savedColumnsOrder ? JSON.parse(savedColumnsOrder) : {};

        const savedColumnWidths = localStorage.getItem(`columnWidths-${saveStorageProps.pageType}-${template._id}`);
        const defaultColumnWidths = savedColumnWidths ? JSON.parse(savedColumnWidths) : {};

        const { isLoading: isDeleteLoading, mutateAsync: deleteMutation } = useMutation(
            (id: string) =>
                deleteEntityRequest({
                    selectAll: false,
                    templateId: template?._id as string,
                    idsToInclude: [id],
                    deleteAllRelationships: false,
                } as IDeleteEntityBody<false>),
            {
                onError: (error: AxiosError) => {
                    toast.error(<ErrorToast axiosError={error} defaultErrorMessage={i18next.t('wizard.entity.failedToDelete')} />);
                },
                onSuccess: () => {
                    refetch?.();
                    toast.success(i18next.t('wizard.entity.deletedSuccessfully'));
                },
                onSettled: () => {
                    setOpenDeleteDialog(false);
                    setSelectedRow('');
                },
            },
        );

        const { mutateAsync: updateEntityStatus } = useMutation(
            ({
                currEntity: currentEntity,
                disabled,
                ignoredRules,
            }: {
                currEntity: IEntity;
                disabled: boolean;
                ignoredRules?: IRuleBreach['brokenRules'];
            }) => updateEntityStatusRequest(currentEntity.properties._id, disabled, JSON.stringify(ignoredRules)),
            {
                onSuccess: (data) => {
                    if (data.properties.disabled) toast.success(i18next.t('entityPage.disabledSuccessfully'));
                    else toast.success(i18next.t('entityPage.activatedSuccessfully'));
                    refetch?.();
                },
                onError: (_err: AxiosError, { disabled }) => {
                    if (disabled) toast.error(i18next.t('entityPage.failedToDisable'));
                    else toast.error(i18next.t('entityPage.failedToActivate'));
                },
            },
        );

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
            getDisplayColumns: () => {
                const validKeys = Object.keys(template.properties.properties);
                return (
                    gridRef.current?.api
                        .getAllDisplayedColumns()
                        .map((column) => column.getColId())
                        .filter((colId) => validKeys.includes(colId)) || []
                );
            },
        }));

        const columnDefProps: IGetColumnDefsOptions<Data> = {
            template,
            getEntityPropertiesData,
            getRowId,
            onNavigateToRow: showNavigateToRowButton ? (data) => navigate(`/entity/${getEntityPropertiesData(data)._id}`) : undefined,
            deleteRowButtonProps,
            menuRowButtonProps,
            hideNonPreview,
            editRowButtonProps,
            hasPermissionToCategory,
            defaultVisibleColumns,
            defaultColumnsOrder,
            defaultColumnWidths,
            rowHeight,
            ignoreType,
            navigate,
            setSelectedRow,
            setOpenDeleteDialog,
            updateEntityStatus,
            searchValue: quickFilterText,
            disableEditCell: !editable || editRowButtonProps?.disabledButton,
        };
        const columnDefs = useDeepCompareMemo(() => getColumnDefs(columnDefProps), [columnDefProps]);

        const datasourceOnFail = (err: unknown) => {
            toast.error(i18next.t('entitiesTableOfTemplate.failedToLoadData'));
            console.error('Failed to load data from datasource. Error:', err);
        };

        const gridStyles = {
            '.ag-center-cols-viewport': {
                minHeight: `${rowHeight * (hasInstances === false ? 2 : pageRowCount)}px !important`,
            },
            '.ag-paging-panel': {
                height: '45px',
            },
            '.ag-cell-inline-editing': {
                height: `${rowHeight}px`,
            },
            '.ag-cell-inline-editing input': {
                border: 'none !important',
            },
        };

        const handleColumnVisible = (params: ColumnVisibleEvent<Data>) => {
            if (!saveStorageProps.shouldSaveVisibleColumns) return;
            if (params?.column?.getColId() && params.column.getColId() === 'disabled') {
                const { disabled, ...rest } = params.api.getFilterModel();
                const filterModel = params.column.isVisible() ? params.api.getFilterModel() : { ...rest, ...defaultFilterModel };
                params.api.setFilterModel(filterModel);
            }
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

        const handleSortChanged = () => {
            if (!saveStorageProps.shouldSaveSorting) return;
            const sortModel = getSortModel();
            localStorage.setItem(`sortModel-${saveStorageProps.pageType}-${template._id}`, JSON.stringify(sortModel));
        };

        const handleBodyScroll = debounce((params: BodyScrollEvent<Data>) => {
            if (!saveStorageProps.shouldSaveScrollPosition) return;
            if (params.api.getVerticalPixelRange().top >= 0 && rowModelType === 'infinite') {
                sessionStorage.setItem(`scrollPosition-${template._id}`, JSON.stringify(params.api.getVerticalPixelRange().top));
            }
        }, 500);

        const { isLoading: isUpdateLoading, mutateAsync: updateMutation } = useMutation(
            ({ newEntityData, ignoredRules }: { newEntityData: EntityWizardValues; ignoredRules?: IRuleBreach['brokenRules'] }) =>
                updateEntityRequestForMultiple(newEntityData.properties._id, newEntityData, ignoredRules),
            {
                onSuccess: () => {
                    toast.success(i18next.t('wizard.entity.editedSuccessfully'));
                    gridRef.current?.api.refreshServerSide();
                    setUpdateWithRuleBreachDialogState({ isOpen: false });
                },
                onError: (err: AxiosError, { newEntityData: newEntityDate }) => {
                    const errorMetadata = err.response?.data?.metadata;

                    switch (errorMetadata?.errorCode) {
                        case errorCodes.failedConstraintsValidation:
                            switch (errorMetadata.constraint.type) {
                                case 'REQUIRED':
                                    toast.error(
                                        `${i18next.t('wizard.entity.failedToEdit')}: ${i18next.t('wizard.entity.missingInputForRequiredField')}`,
                                    );
                                    gridRef.current?.api.refreshServerSide();
                                    break;
                                case 'UNIQUE':
                                    const { properties } = errorMetadata.constraint as Omit<IUniqueConstraint, 'constraintName'>;
                                    const constraintPropsDisplayNames = properties.map(
                                        (prop) => `${prop}-${template.properties.properties[prop].title}`,
                                    );
                                    constraintPropsDisplayNames.forEach((uniqueProp) => {
                                        toast.error(
                                            `${i18next.t('wizard.entity.failedToEdit')}: ${i18next.t(
                                                `wizard.entity.someEntityAlreadyHasTheSameField${constraintPropsDisplayNames.length > 1 ? 's' : ''}`,
                                            )} ${uniqueProp.substring(uniqueProp.indexOf('-') + 1)}`,
                                        );
                                    });
                                    gridRef.current?.api.refreshServerSide();
                                    break;
                                default:
                                    break;
                            }
                            break;
                        case errorCodes.actionsCustomError:
                            toast.error(errorMetadata?.message);
                            gridRef.current?.api.refreshServerSide();
                            break;
                        case errorCodes.ruleBlock:
                            const { brokenRules, rawBrokenRules, actions, rawActions } = errorMetadata;

                            setUpdateWithRuleBreachDialogState({
                                isOpen: true,
                                brokenRules,
                                rawBrokenRules,
                                updateEntityFormData: newEntityDate,
                                actions,
                                rawActions,
                            });
                            toast.error(i18next.t('wizard.entity.failedToEdit'));
                            break;
                        default:
                            break;
                    }
                },
            },
        );

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
                if (isSideBarOpen) gridApi.closeToolPanel();
                else gridApi.openToolPanel('columns');
            },
            getDisplayColumns: () => gridRef.current?.api.getAllDisplayedColumns().map((column) => column.getColId()) || [],
        }));

        const rowModelProps = useMemo(
            () => getRowModelProps(rowModelType, template, rowData, pageRowCount!, table, quickFilterText, datasourceOnFail, hasInstances),
            [rowModelType, template, rowData, pageRowCount, quickFilterText, hasInstances],
        );

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

        const handlePaginationChanged = (params: PaginationChangedEvent<Data>) => {
            const { api, newPage } = params;

            if (!saveStorageProps.shouldSavePagination) return;
            if (api && newPage) {
                const currentPage = api.paginationGetCurrentPage();
                sessionStorage.setItem(`currentPage-${saveStorageProps.pageType}-${template._id}`, JSON.stringify(currentPage));
            }
        };

        const statusPanels = useMemo(() => {
            const panels: StatusPanelDef[] = [{ statusPanel: RowCountGridStatusBar, align: 'right' }];

            if (multipleSelect)
                panels.push({
                    statusPanel: MultiSelectStatusBar,
                    align: 'left',
                    statusPanelParams: { template, quickFilterText },
                });

            return panels;
        }, [multipleSelect, quickFilterText, template]);

        const rowSelection = useMemo<RowSelectionOptions | 'single' | 'multiple' | undefined>(() => {
            if (onRowSelected) return 'single';

            if (multipleSelect)
                return {
                    mode: 'multiRow',
                    enableClickSelection: false,
                };

            return undefined;
        }, [multipleSelect, onRowSelected]);

        const gridContent = (
            <>
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
                        suppressDragLeaveHidesColumns={ignoreType}
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
                        rowSelection={rowSelection}
                        suppressAggFuncInHeader
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
                                    LocalStorage.set(`tableFilter-${saveStorageProps.pageType}-${template._id}`, filterModel);
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
                            else if (rowModelType !== 'clientSide') params.api.setFilterModel(defaultFilterModel);
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
                                    }, 300);
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
                        statusBar={rowModelType === 'infinite' ? { statusPanels } : undefined}
                        localeText={agGridLocaleText}
                        paginationPageSizeSelector={paginationPageSizeSelector}
                        onCellEditingStopped={(params: CellEditingStoppedEvent) => {
                            setCurrEditingCell(undefined);
                            if (params.valueChanged === false) return;
                            const isEmpty = params.newValue === '' || params.newValue === null || params.newValue.length === 0;
                            const isRequired = template.properties.required.includes(params.colDef.field!);
                            const updatedProperties = {
                                ...params.data?.properties,
                                // eslint-disable-next-line no-nested-ternary
                                [params.column.getColId()]: isEmpty ? (isRequired ? undefined : '') : params.newValue,
                            };
                            setCurrEntity({ templateId: template._id, properties: params.data?.properties });

                            const properties: any = { properties: updatedProperties };
                            gridRef.current?.api.forEachNode((rowNode) => {
                                if (rowNode.data && getRowId(properties) === getRowId(rowNode.data)) {
                                    rowNode.updateData(properties);
                                }
                            });

                            updateMutation({
                                newEntityData: {
                                    template,
                                    properties: updatedProperties,
                                    attachmentsProperties: {},
                                },
                            });
                        }}
                        onCellClicked={(params) => {
                            const isHidden = template.properties.hide.includes(params.colDef.field!);
                            if (isHidden || !params.colDef.cellEditor) return;
                            setCurrEditingCell(params);
                            if (currEditingCell && currEditingCell.value !== params.value) params.api.stopEditing();
                        }}
                    />
                    <AreYouSureDialog
                        open={openDeleteDialog && selectedRow !== ''}
                        handleClose={() => setOpenDeleteDialog(false)}
                        onYes={() => {
                            deleteMutation(selectedRow);
                        }}
                        isLoading={isDeleteLoading}
                    />
                </Box>
                {updateWithRuleBreachDialogState.isOpen && (
                    <ActionOnEntityWithRuleBreachDialog
                        isLoadingActionOnEntity={isUpdateLoading}
                        handleClose={() => setUpdateWithRuleBreachDialogState({ isOpen: false })}
                        doActionEntity={() => {
                            return updateMutation({
                                newEntityData: updateWithRuleBreachDialogState.updateEntityFormData!,
                                ignoredRules: updateWithRuleBreachDialogState.rawBrokenRules!,
                            });
                        }}
                        actionType={ActionTypes.UpdateEntity}
                        brokenRules={updateWithRuleBreachDialogState.brokenRules!}
                        rawBrokenRules={updateWithRuleBreachDialogState.rawBrokenRules!}
                        currEntity={currEntity}
                        entityFormData={updateWithRuleBreachDialogState.updateEntityFormData!}
                        onUpdatedRuleBlock={(brokenRules) =>
                            setUpdateWithRuleBreachDialogState((prevState) => ({
                                ...prevState,
                                brokenRules,
                            }))
                        }
                        onCreateRuleBreachRequest={() => setUpdateWithRuleBreachDialogState({ isOpen: false })}
                        actions={updateWithRuleBreachDialogState.actions}
                        rawActions={updateWithRuleBreachDialogState.rawActions}
                    />
                )}
            </>
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

export default EntitiesTableOfTemplate as <Data = EntityData>(
    props: EntitiesTableOfTemplateProps<Data> & { ref?: React.ForwardedRef<EntitiesTableOfTemplateRef<Data>> },
) => ReturnType<typeof EntitiesTableOfTemplate>;
