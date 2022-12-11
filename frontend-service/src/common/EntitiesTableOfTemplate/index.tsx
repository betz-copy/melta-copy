import React, { forwardRef, ForwardedRef, useImperativeHandle, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, GlobalStyles } from '@mui/material';
import pickBy from 'lodash.pickby';
import { ColDef, IServerSideDatasource } from '@ag-grid-community/core';
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

import '@ag-grid-community/core/dist/styles/ag-grid.css';
import '@ag-grid-community/core/dist/styles/ag-theme-material.css';
import '../../css/table.css';

import { DateFilterComponent } from '../../utils/agGrid/DateFilterComponent';
import { IEntity } from '../../interfaces/entities';
import { getEntitiesByTemplateRequest } from '../../services/entitiesService';
import { getColumnDefs } from './getColumnDefs';
import { trycatch } from '../../utils/trycatch';
import { LocalStorage } from '../../utils/localStorage';

export const getDatasource = (
    templateId: IMongoEntityTemplatePopulated['_id'],
    quickFilterText: string | undefined,
    onFail: ((err: unknown) => void) | undefined,
): IServerSideDatasource => {
    return {
        async getRows(params) {
            const { sortModel, startRow, endRow, filterModel } = params.request;
            const { result: data, err } = await trycatch(() =>
                getEntitiesByTemplateRequest(templateId, {
                    sortModel,
                    startRow,
                    endRow,
                    filterModel,
                    quickFilter: quickFilterText !== '' ? quickFilterText : undefined,
                }),
            );
            if (err || !data) {
                onFail?.(err);
                params.fail();
                return;
            }

            params.success({ rowData: data.rows, rowCount: data.lastRowIndex });
        },
    };
};

const getRowModelProps = <Data extends any>(
    rowModelType: 'serverSide' | 'clientSide',
    templateId: IMongoEntityTemplatePopulated['_id'],
    rowData: Data[] | undefined,
    datasource: IServerSideDatasource | undefined,
    quickFilterText: string | undefined,
    datasourceOnFail: ((err: unknown) => void) | undefined,
): React.ComponentProps<typeof AgGridReact> => {
    if (rowModelType === 'clientSide') {
        return { rowModelType, rowData };
    }
    return {
        rowModelType,
        serverSideDatasource: datasource ?? getDatasource(templateId, quickFilterText, datasourceOnFail),
        serverSideStoreType: 'partial',
        cacheBlockSize: 50,
        maxBlocksInCache: 1000,
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
    disabledEntity?: boolean;
    getRowId: (data: Data) => string;
    getEntityPropertiesData: (data: Data) => IEntity['properties'];
    rowModelType: 'serverSide' | 'clientSide';
    rowData?: Data[];
    datasource?: IServerSideDatasource;
    quickFilterText?: string;
    rowHeight: number;
    pageRowCount?: number;
    fontSize: React.CSSProperties['fontSize'];
    minColumnWidth: number;
    hideNonPreview?: boolean;
    filterStorageProps: { shouldSaveFilter: boolean; pageType?: string };
};

export type EntitiesTableOfTemplateRef = {
    getExcelData: () => string | undefined;
    resetFilter: () => void;
    refreshServerSide: () => void;
};

const EntitiesTableOfTemplate = forwardRef<EntitiesTableOfTemplateRef, EntitiesTableOfTemplateProps<unknown>>(
    <Data extends any>(
        {
            template,
            onRowSelected,
            showNavigateToRowButton,
            deleteRowButtonProps,
            disabledEntity,
            getRowId,
            getEntityPropertiesData,
            rowModelType,
            rowData,
            datasource,
            quickFilterText,
            rowHeight,
            pageRowCount = 5,
            fontSize,
            minColumnWidth,
            hideNonPreview,
            filterStorageProps,
        }: EntitiesTableOfTemplateProps<Data>,
        ref: ForwardedRef<EntitiesTableOfTemplateRef>,
    ) => {
        const navigate = useNavigate();

        const gridRef = useRef<AgGridReact>(null);

        useImperativeHandle(ref, () => {
            return {
                getExcelData() {
                    return gridRef.current?.api.getSheetDataForExcel({ sheetName: template.displayName });
                },
                resetFilter() {
                    gridRef.current?.api.setFilterModel(null);
                },
                refreshServerSide() {
                    gridRef.current?.api.refreshServerSideStore({ purge: true });
                },
            };
        });

        const columnDefs: ColDef[] = getColumnDefs(
            template,
            getEntityPropertiesData,
            !showNavigateToRowButton ? undefined : (data) => navigate(`/entity/${getEntityPropertiesData(data)._id}`),
            disabledEntity,
            deleteRowButtonProps,
            hideNonPreview,
        );

        const datasourceOnFail = (err: unknown) => {
            toast.error(i18next.t('entitiesTableOfTemplate.failedToLoadData'));
            // eslint-disable-next-line no-console
            console.log('failed to load data from datasource. err:', err);
        };

        // useMemo because on SSRM if datasource prop changes it reloads rows (because maybe getRows is changed)
        // because we recreate datasource object on every irrelevant render, we recreate only on dependencies
        // usually only quickFilterText changes on deps
        const rowModelProps = useMemo(
            () => getRowModelProps(rowModelType, template._id, rowData, datasource, quickFilterText, datasourceOnFail),
            [rowModelType, template._id, rowData, datasource, quickFilterText],
        );

        const getGlobalStyles = () => ({
            '.ag-column-select-virtual-list-viewport': { height: `${rowHeight * pageRowCount}px !important` },
            '.ag-center-cols-clipper': { minHeight: `${rowHeight * pageRowCount}px !important` },
        });

        return (
            <Box>
                <GlobalStyles styles={getGlobalStyles()} />
                <AgGridReact
                    ref={gridRef}
                    getRowStyle={(params) => {
                        if (params.data && getEntityPropertiesData(params.data).disabled) return { background: 'rgb(159 147 147 / 16%)' };
                        return { background: 'default' };
                    }}
                    className="ag-theme-material"
                    containerStyle={{
                        width: '100%',
                        fontFamily: 'Rubik',
                        fontSize,
                        fontWeight: 300,
                    }}
                    modules={[ServerSideRowModelModule, ColumnsToolPanelModule, MenuModule, SetFilterModule, ClientSideRowModelModule]}
                    domLayout="autoHeight"
                    getRowId={({ data }) => getRowId(data)}
                    columnDefs={columnDefs}
                    {...rowModelProps}
                    pagination
                    paginationPageSize={pageRowCount}
                    rowHeight={rowHeight}
                    components={{
                        agDateInput: DateFilterComponent,
                    }}
                    enableRtl
                    enableCellTextSelection
                    rowSelection={onRowSelected ? 'single' : undefined}
                    onRowSelected={!onRowSelected ? undefined : ({ data }) => onRowSelected(data)}
                    rowStyle={onRowSelected ? { cursor: 'pointer' } : undefined}
                    suppressCellFocus
                    onFilterChanged={(params) => {
                        if (filterStorageProps.shouldSaveFilter) {
                            const filterModel = params.api.getFilterModel();
                            const filterModelKeys = Object.keys(filterModel);

                            if (filterModelKeys.length === 1 && filterModelKeys[0] === 'disabled') {
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
                            disabled: {
                                filterType: 'set',
                                values: ['false'],
                            },
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
    props: EntitiesTableOfTemplateProps<Data> & { ref?: React.ForwardedRef<EntitiesTableOfTemplateRef> },
) => ReturnType<typeof EntitiesTableOfTemplate>;
