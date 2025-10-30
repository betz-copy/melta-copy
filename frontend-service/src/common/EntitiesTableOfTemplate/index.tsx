import {
    BodyScrollEvent,
    CellEditingStoppedEvent,
    ColumnMovedEvent,
    ColumnResizedEvent,
    ColumnState,
    ColumnVisibleEvent,
    FilterModel,
    FirstDataRenderedEvent,
    GridApi,
    GridReadyEvent,
    IServerSideDatasource,
    IServerSideGetRowsParams,
    IServerSideGetRowsRequest,
    PaginationChangedEvent,
    RowDataUpdatedEvent,
    RowSelectionOptions,
    RowStyle,
    StatusPanelDef,
} from '@ag-grid-community/core';
import { AgGridReact } from '@ag-grid-community/react';
import { Box, CircularProgress, debounce } from '@mui/material';
import { AxiosError } from 'axios';
import i18next from 'i18next';
import { pickBy } from 'lodash';
import isEqual from 'lodash.isequal';
import sortBy from 'lodash.sortby';
import React, { ForwardedRef, forwardRef, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { useLocation } from 'wouter';
import '../../css/resizeTable.css';
import '../../css/table.css';
import { environment } from '../../globals';
import { IChildTemplateMap, IChildTemplatePopulated, IMongoChildTemplatePopulated } from '../../interfaces/childTemplates';
import { EntityData, IDeleteEntityBody, IEntity, IEntityExpanded, ISearchFilter, IUniqueConstraint } from '../../interfaces/entities';
import { IEntityTemplateMap, IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import { IErrorResponse } from '../../interfaces/error';
import { IRelationship } from '../../interfaces/relationships';
import { ActionTypes, IAction, IActionPopulated } from '../../interfaces/ruleBreaches/actionMetadata';
import { IBrokenRule, IRuleBreach, IRuleBreachPopulated } from '../../interfaces/ruleBreaches/ruleBreach';
import { ISemanticSearchResult } from '../../interfaces/semanticSearch';
import ActionOnEntityWithRuleBreachDialog from '../../pages/Entity/components/ActionOnEntityWithRuleBreachDialog';
import { searchEntitiesOfTemplateClientSideRequest } from '../../services/clientSideService';
import {
    deleteEntityRequest,
    searchEntitiesOfTemplateRequest,
    updateEntityRequestForMultiple,
    updateEntityStatusRequest,
} from '../../services/entitiesService';
import { useClientSideUserStore } from '../../stores/clientSideUser';
import { useDarkModeStore } from '../../stores/darkMode';
import { useUserStore } from '../../stores/user';
import { useWorkspaceStore } from '../../stores/workspace';
import { agGridLocaleText } from '../../utils/agGrid/agGridLocaleText';
import { agGridToSearchEntitiesOfTemplateRequest } from '../../utils/agGrid/agGridToSearchEntitiesOfTemplateRequest';
import { DateFilterComponent } from '../../utils/agGrid/DateFilterComponent';
import { IAGGridRequest } from '../../utils/agGrid/interfaces';
import useDeepCompareMemo from '../../utils/hooks/useDeepCompareMemo';
import { LocalStorage } from '../../utils/localStorage';
import { isChildTemplate } from '../../utils/templates';
import { trycatch } from '../../utils/trycatch';
import { AreYouSureDialog } from '../dialogs/AreYouSureDialog';
import { EntityWizardValues } from '../dialogs/entity';
import { MultiSelectStatusBar } from '../EntitiesPage/MultiSelectStatusBar';
import { ResizeBox } from '../EntitiesPage/ResizeBox';
import { RowCountGridStatusBar } from '../EntitiesPage/RowCountGridStatusBar';
import { ErrorToast } from '../ErrorToast';
import { getColumnDefs, IGetColumnDefsOptions } from './getColumnDefs';

const { errorCodes } = environment;
const { cacheBlockSize, maxConcurrentDatasourceRequests, actionPrefix, actionsWidth, rowCountInfiniteModeWithoutExpand } = environment.agGrid;
const { columnWidths, columnsOrder, visibleColumns } = environment.agGrid.localStorage;

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

export enum TablePageType {
    category = 'category',
    relationship = 'relationship',
    globalSearch = 'globalSearch',
    clientSide = 'client-side',
    map = 'map',
}

export const getDatasource = <Data = EntityData>(
    template: IMongoEntityTemplatePopulated | IMongoChildTemplatePopulated,
    // tableCount: number, // comment out  waiting for Itay
    quickFilterText?: string,
    onFail?: (err: unknown) => void,
    rowData?: IConnection[],
    defaultFilter?: ISearchFilter,
    pageType?: string,
    clientSideUserEntityId?: string,
    childTemplatesOfParentIds?: string[],
): IServerSideDatasource => {
    const parentTemplateId = isChildTemplate(template) ? template.parentTemplate._id : template._id;
    const childTemplateIds = isChildTemplate(template) ? (childTemplatesOfParentIds ?? [template._id]) : [];

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
                pageType === 'client-side'
                    ? searchEntitiesOfTemplateClientSideRequest(
                          parentTemplateId,
                          clientSideUserEntityId!,
                          agGridToSearchEntitiesOfTemplateRequest(
                              { ...agGridRequest, quickFilter: quickFilterText } as IAGGridRequest,
                              template,
                              // tableCount, // comment out  waiting for Itay
                              defaultFilter,
                          ),
                      )
                    : searchEntitiesOfTemplateRequest(
                          parentTemplateId,
                          agGridToSearchEntitiesOfTemplateRequest(
                              { ...agGridRequest, quickFilter: quickFilterText } as IAGGridRequest,
                              template,
                              // tableCount, // comment out  waiting for Itay
                              defaultFilter,
                          ),
                          childTemplateIds,
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

export const getRowModelProps = <Data = EntityData>(
    rowModelType: 'serverSide' | 'clientSide' | 'infinite',
    template: IMongoEntityTemplatePopulated | IMongoChildTemplatePopulated,
    rowData: Data[] | undefined,
    paginationPageSize: number,
    // tableCount: number,// comment out  waiting for Itay
    quickFilterText?: string,
    datasourceOnFail?: (err: unknown) => void,
    hasInstances?: boolean,
    defaultFilter?: ISearchFilter,
    pageType?: string,
    clientSideUserEntityId?: string,
    childTemplatesOfParentIds?: string[],
): React.ComponentProps<typeof AgGridReact<Data>> => {
    if (rowModelType === 'clientSide') {
        return {
            rowModelType,
            rowData,
            pagination: hasInstances ?? true,
            paginationPageSize,
        };
    }

    return {
        rowModelType: 'serverSide',
        serverSideDatasource: getDatasource<IConnection>(
            template,
            quickFilterText,
            datasourceOnFail,
            rowData as IConnection[],
            defaultFilter,
            pageType,
            clientSideUserEntityId,
            childTemplatesOfParentIds,
        ),
        cacheBlockSize: rowModelType === 'serverSide' ? cacheBlockSize : undefined,
        pagination: rowModelType === 'serverSide',
        paginationPageSize,
        maxConcurrentDatasourceRequests,
    };
};

const LoadingCellRenderer = () => <CircularProgress size={20} sx={{ marginLeft: 1 }} />;

export type EntitiesTableOfTemplateProps<Data> = {
    template: (IMongoEntityTemplatePopulated | IMongoChildTemplatePopulated) & { entitiesWithFiles?: ISemanticSearchResult[string] };
    entities?: Data[];
    onRowSelected?: (data: Data) => void;
    showNavigateToRowButton: boolean;
    deleteRowButtonProps?: IButtonPopoverProps<Data>;
    editRowButtonProps?: IButtonPopoverProps<Data>;
    menuRowButtonProps?: boolean;
    addRelationshipReferenceButtonProps?: string;
    hasPermissionToTemplate?: boolean;
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
        pageType?: TablePageType | `entity-${string}`;
    };
    onFilter?: () => void;
    mainEntity?: IEntityExpanded;
    ignoreType?: boolean;
    refetch?: () => void;
    hasInstances?: boolean;
    paginationPageSizeSelector?: boolean | number[];
    infiniteModeWithoutExpand?: boolean;
    editable?: boolean;
    defaultFilter?: FilterModel;
    disableFilter?: boolean;
    columnsToShow?: string[];
    setUpdatedTemplateIds?: React.Dispatch<React.SetStateAction<string[]>>;
    actionsColumnWidth?: number;
    childTemplatesOfParent?: IChildTemplatePopulated[];
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
    resizeTableHeight: (newHeight: number) => void;
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
            addRelationshipReferenceButtonProps,
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
            hasPermissionToTemplate,
            ignoreType,
            hasInstances,
            multipleSelect,
            paginationPageSizeSelector = environment.agGrid.paginationPageSizeSelector as unknown as number[],
            infiniteModeWithoutExpand,
            editable = true,
            defaultFilter,
            disableFilter = false,
            columnsToShow,
            setUpdatedTemplateIds,
            actionsColumnWidth,
            childTemplatesOfParent,
        }: EntitiesTableOfTemplateProps<Data>,
        ref: ForwardedRef<EntitiesTableOfTemplateRef<Data>>,
    ) => {
        const queryClient = useQueryClient();
        const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;
        const childTemplates = queryClient.getQueryData<IChildTemplateMap>('getChildTemplates');

        const [_, navigate] = useLocation();
        const darkMode = useDarkModeStore((state) => state.darkMode);
        const savedVisibleColumns = localStorage.getItem(`${visibleColumns}${saveStorageProps.pageType}-${template._id}`);
        const defaultVisibleColumnsRef = useRef<Record<string, boolean>>(savedVisibleColumns ? JSON.parse(savedVisibleColumns) : {});
        const workspace = useWorkspaceStore((state) => state.workspace);
        const { rowCount, defaultExpandedRowCount } = workspace.metadata.agGrid;

        const childTemplateId = isChildTemplate(template) ? template._id : undefined;

        const currentUser = useUserStore((state) => state.user);
        const clientSideUserEntity = useClientSideUserStore((state) => state.clientSideUserEntity);

        if (!pageRowCount) pageRowCount = rowCount;

        const gridRef = useRef<AgGridReact<Data>>(null);
        const tableRef = useRef<HTMLDivElement>(null);

        const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

        const minHeightTable = rowHeight * pageRowCount + rowHeight * 2;
        const [gridHeight, setGridHeight] = useState<number>(() =>
            infiniteModeWithoutExpand ? rowHeight * rowCountInfiniteModeWithoutExpand : rowHeight * defaultExpandedRowCount,
        );
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

        const filteredColumns = Object.keys(pickBy(template.properties.properties, (property) => property.comment === undefined));

        const savedColumnsOrder = localStorage.getItem(`${columnsOrder}${saveStorageProps.pageType}-${template._id}`);
        const [defaultColumnsOrder, setDefaultColumnsOrder] = useState(savedColumnsOrder ? JSON.parse(savedColumnsOrder) : {});

        const savedColumnWidths = localStorage.getItem(`${columnWidths}${saveStorageProps.pageType}-${template._id}`);
        const [defaultColumnWidths, setDefaultColumnWidths] = useState<Record<string, number>>(
            savedColumnWidths ? JSON.parse(savedColumnWidths) : {},
        );

        const { isLoading: isDeleteLoading, mutateAsync: deleteMutation } = useMutation(
            (id: string) =>
                deleteEntityRequest({
                    selectAll: false,
                    templateId: isChildTemplate(template) ? template.parentTemplate._id : template?._id,
                    idsToInclude: [id],
                    deleteAllRelationships: false,
                    childTemplateId,
                } as IDeleteEntityBody<false>),
            {
                onError: (error: AxiosError) => {
                    toast.error(<ErrorToast axiosError={error} defaultErrorMessage={i18next.t('wizard.entity.failedToDelete')} />);
                },
                onSuccess: () => {
                    setUpdatedTemplateIds?.([isChildTemplate(template) ? template.parentTemplate._id : template?._id]);
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
            }) => updateEntityStatusRequest(currentEntity.properties._id, disabled, JSON.stringify(ignoredRules), childTemplateId),
            {
                onSuccess: (data) => {
                    if (data.properties.disabled) toast.success(i18next.t('entityPage.disabledSuccessfully'));
                    else toast.success(i18next.t('entityPage.activatedSuccessfully'));
                    setUpdatedTemplateIds?.([data.templateId]);
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

        const columnDefProps: IGetColumnDefsOptions<Data> = {
            template,
            getEntityPropertiesData,
            getRowId,
            onNavigateToRow: showNavigateToRowButton ? (data) => navigate(`/entity/${getEntityPropertiesData(data)._id}`) : undefined,
            deleteRowButtonProps,
            menuRowButtonProps,
            addRelationshipReferenceButtonProps,
            hideNonPreview,
            editRowButtonProps,
            hasPermissionToTemplate,
            defaultVisibleColumns: defaultVisibleColumnsRef.current,
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
            entityTemplates,
            pageType: saveStorageProps.pageType,
            columnsToShow,
            entityTemplateMap: entityTemplates,
            childEntityTemplateMap: childTemplates,
            currentUser,
            currentClientSideUser: clientSideUserEntity,
            actionsColumnWidth,
            darkMode,
            workspace,
            childTemplatesOfParent,
        };
        const columnDefs = useDeepCompareMemo(() => getColumnDefs(columnDefProps), [columnDefProps]);
        const childTemplatesOfParentIds = childTemplatesOfParent?.map(({ _id }) => _id);

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
            '.ag-theme-material .ag-header-cell-text': {
                fontSize: '14px !important',
            },
        };

        const updateVisibleColumns = (params: ColumnVisibleEvent<Data, any> | GridReadyEvent<Data, any>) => {
            const columnState = params.api.getColumnState();

            const updatedVisibleColumns = columnState.reduce<Record<string, boolean>>((acc, col) => {
                acc[col.colId] = !col.hide;
                return acc;
            }, {});

            localStorage.setItem(`${visibleColumns}${saveStorageProps.pageType}-${template._id}`, JSON.stringify(updatedVisibleColumns));
            defaultVisibleColumnsRef.current = updatedVisibleColumns;

            return updatedVisibleColumns;
        };

        const handleColumnVisible = (params: ColumnVisibleEvent<Data>) => {
            if (!saveStorageProps.shouldSaveVisibleColumns) return;
            if (params?.column?.getColId() && params.column.getColId() === 'disabled') {
                const { disabled, ...rest } = params.api.getFilterModel();
                const filterModel = params.column.isVisible() ? rest : { ...rest, ...defaultFilterModel };
                params.api.setFilterModel(filterModel);
            }

            updateVisibleColumns(params);
        };

        const handleColumnsOrder = (
            params: ColumnMovedEvent<Data> | GridReadyEvent<Data, any> | FirstDataRenderedEvent<Data, any> | RowDataUpdatedEvent<Data, any>,
        ) => {
            if (!saveStorageProps.shouldSaveColumnOrder) return;
            const columnState = params.api.getColumnState();
            const newColumnsOrder = columnState.reduce<Record<string, { order: number }>>((acc, column, index) => {
                acc[column.colId] = { order: index };
                return acc;
            }, {});
            localStorage.setItem(`${columnsOrder}${saveStorageProps.pageType}-${template._id}`, JSON.stringify(newColumnsOrder));
            setDefaultColumnsOrder(newColumnsOrder);
        };

        const handleColumnResized = (params: ColumnResizedEvent<Data>) => {
            if (params.finished && params.column && ['autosizeColumns', 'uiColumnDragged', 'uiColumnResized'].includes(params.source)) {
                const currColumnWidths = localStorage.getItem(`${columnWidths}${saveStorageProps.pageType}-${template._id}`);
                const currColumnWidthsParsed = currColumnWidths ? JSON.parse(currColumnWidths) : {};
                localStorage.setItem(
                    `${columnWidths}${saveStorageProps.pageType}-${template._id}`,
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

        const calculateRemainingWidth = (columnStates: ColumnState[], hasActions: boolean, isRemovedFields: boolean): number => {
            const usedWidth: number = isRemovedFields ? 0 : Object.values(defaultColumnWidths).reduce((sum, width) => sum + width, 0);
            const totalGridWidth: number = tableRef.current?.offsetWidth!;
            const widthConsumed: number = columnStates.reduce((sum, col) => sum + col.width!, 0);
            return totalGridWidth - usedWidth - widthConsumed - (hasActions ? actionsWidth : 0);
        };

        const autoSizeAll = (params: GridReadyEvent<Data, any> | RowDataUpdatedEvent<Data, any>, visibleKeys: string[]) => {
            const { api } = params;

            const hasActions = visibleKeys.some((key) => key.startsWith(actionPrefix));

            const uniqKeys = ['disabled', 'createdAt', 'updatedAt'];
            const defaultKeys = Object.keys(defaultColumnWidths).filter((key) => !key.includes(actionPrefix) && !uniqKeys.includes(key));
            const isRemovedFields = defaultKeys.some((key) => !filteredColumns.includes(key));

            if (filteredColumns.length === defaultKeys.length && filteredColumns.every((key, index) => key === defaultKeys[index])) return;

            handleColumnsOrder(params);

            const shouldIncludeKey = (key) => key !== `${actionPrefix}${template._id}` && (isRemovedFields || !defaultColumnWidths[key]);
            const columnsKeys = visibleKeys.filter(shouldIncludeKey);
            if (columnsKeys.length === 0) return;

            api.refreshHeader();
            api.sizeColumnsToFit();
            Object.keys(defaultColumnWidths).length ? api.autoSizeColumns(columnsKeys) : api.autoSizeColumns(filteredColumns);

            const columnStates = api.getColumnState().filter((col) => columnsKeys.includes(col.colId));

            const remainingWidth = calculateRemainingWidth(columnStates, hasActions, isRemovedFields);

            const columnsWidth: Record<string, number> = columnStates.reduce(
                (acc, col, index) => {
                    const newWidth = index === columnStates.length - 1 ? col.width! + Math.max(remainingWidth, 0) : col.width!;
                    acc[col.colId] = newWidth;
                    return acc;
                },
                { [`${actionPrefix}${template._id}`]: 200 },
            );

            api.setColumnWidths(Object.entries(columnsWidth).map(([key, newWidth]) => ({ key, newWidth })));

            if (Object.keys(columnsWidth).length) {
                const updatedWidths = isRemovedFields ? columnsWidth : { ...defaultColumnWidths, ...columnsWidth };
                localStorage.setItem(`${columnWidths}${saveStorageProps.pageType}-${template._id}`, JSON.stringify(updatedWidths));
                setDefaultColumnWidths(updatedWidths);
            }
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
                    const parentTemplateId = isChildTemplate(template) ? template.parentTemplate._id : template._id;
                    setUpdatedTemplateIds?.([parentTemplateId]);
                    setUpdateWithRuleBreachDialogState({ isOpen: false });
                },
                onError: (err: AxiosError, { newEntityData: newEntityDate }) => {
                    const errorMetadata = (err.response?.data as IErrorResponse)?.metadata;

                    switch (errorMetadata?.errorCode) {
                        case errorCodes.failedConstraintsValidation:
                            switch (errorMetadata.constraint.type) {
                                case 'REQUIRED':
                                    toast.error(
                                        `${i18next.t('wizard.entity.failedToEdit')}: ${i18next.t('wizard.entity.missingInputForRequiredField')}`,
                                    );
                                    gridRef.current?.api.refreshServerSide();
                                    break;
                                case 'UNIQUE': {
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
                                }
                                default:
                                    break;
                            }
                            break;
                        case errorCodes.actionsCustomError:
                            toast.error(errorMetadata?.message);
                            gridRef.current?.api.refreshServerSide();
                            break;
                        case errorCodes.ruleBlock: {
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
                        }
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
                if (!tableRef.current) return;
                const ro = new ResizeObserver((_el, observer) => {
                    tableRef.current!.scrollIntoView({ behavior: 'smooth', block: 'end' });
                    observer.disconnect();
                });
                ro.observe(tableRef.current);
                return () => ro.disconnect();
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
            resizeTableHeight: (newHeight: number) => setGridHeight(newHeight),
        }));

        const rowModelProps = useMemo(
            () =>
                getRowModelProps(
                    rowModelType,
                    template,
                    rowData,
                    pageRowCount!,
                    quickFilterText,
                    datasourceOnFail,
                    hasInstances,
                    defaultFilter as ISearchFilter | undefined,
                    saveStorageProps.pageType,
                    clientSideUserEntity?.properties?._id,
                    childTemplatesOfParentIds,
                ),
            [rowModelType, template, rowData, pageRowCount, quickFilterText, hasInstances, defaultFilter, childTemplatesOfParentIds],
        );

        const statusPanels = useMemo(() => {
            const panels: StatusPanelDef[] = [{ statusPanel: RowCountGridStatusBar, align: 'right' }];

            if (multipleSelect)
                panels.push({
                    statusPanel: MultiSelectStatusBar,
                    align: 'left',
                    statusPanelParams: {
                        template,
                        quickFilterText,
                        setUpdatedTemplateIds,
                    },
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
                    width="100%"
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
                        onColumnMoved={handleColumnsOrder}
                        onColumnResized={handleColumnResized}
                        onPaginationChanged={handlePaginationChanged}
                        onBodyScroll={rowModelType === 'infinite' ? handleBodyScroll : undefined}
                        onSortChanged={handleSortChanged}
                        enableRtl
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
                            suppressSizeToFit: true,
                            suppressHeaderFilterButton: disableFilter,
                        }}
                        onGridReady={(params) => {
                            if (saveStorageProps.pageType === TablePageType.map) {
                                gridRef.current?.api.autoSizeAllColumns();
                            } else if (saveStorageProps.pageType) {
                                const updatedVisibleColumns = updateVisibleColumns(params);
                                const visibleKeys = Object.keys(updatedVisibleColumns).filter((key) => updatedVisibleColumns[key] === true);
                                autoSizeAll(params, visibleKeys);
                            }

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
                        statusBar={rowModelType === 'infinite' && !infiniteModeWithoutExpand ? { statusPanels } : undefined}
                        localeText={agGridLocaleText}
                        paginationPageSizeSelector={paginationPageSizeSelector}
                        onCellEditingStopped={(params: CellEditingStoppedEvent) => {
                            setCurrEditingCell(undefined);
                            if (params.valueChanged === false) return;
                            const isEmpty = params.newValue === '' || params.newValue === null || params.newValue.length === 0;
                            const isEmptyArray = params.newValue.length === 0;
                            const isRequired = template.properties.required.includes(params.colDef.field!);
                            const updatedProperties = {
                                ...params.data?.properties,
                                // eslint-disable-next-line no-nested-ternary
                                [params.column.getColId()]: isEmpty ? (isRequired || isEmptyArray ? undefined : '') : params.newValue,
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

        return rowModelType === 'infinite' && !infiniteModeWithoutExpand ? (
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
