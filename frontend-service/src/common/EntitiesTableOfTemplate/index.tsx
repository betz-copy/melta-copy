import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, GlobalStyles } from '@mui/material';

import { ColDef, IServerSideDatasource } from '@ag-grid-community/core';
import { AgGridReact } from '@ag-grid-community/react';
import '@noam7700/ag-grid-enterprise-core';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import { ColumnsToolPanelModule } from '@noam7700/ag-grid-enterprise-column-tool-panel';
import { MenuModule } from '@noam7700/ag-grid-enterprise-menu';
import { ExcelExportModule } from '@noam7700/ag-grid-enterprise-excel-export';
import { SetFilterModule } from '@noam7700/ag-grid-enterprise-set-filter';
import { ServerSideRowModelModule } from '@noam7700/ag-grid-enterprise-server-side-row-model';
import i18next from 'i18next';
import { toast } from 'react-toastify';
import { IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';

import '@ag-grid-community/core/dist/styles/ag-grid.css';
import '@ag-grid-community/core/dist/styles/ag-theme-material.css';
import './table.css';

import { DateFilterComponent } from '../../utils/agGrid/DateFilterComponent';
import { IEntity } from '../../interfaces/entities';
import { getEntitiesByTemplateRequest } from '../../services/entitiesService';
import { getColumnDefs } from './getColumnDefs';
import { trycatch } from '../../utils/trycatch';

export const getDatasource = (
    template: IMongoEntityTemplatePopulated,
    quickFilterText: string | undefined,
    onFail: ((err: unknown) => void) | undefined,
    actionsColumnId: string,
): IServerSideDatasource => {
    let isFirstDataFetched = false;
    return {
        async getRows(params) {
            const { sortModel, startRow, endRow, filterModel } = params.request;
            const { result: data, err } = await trycatch(() =>
                getEntitiesByTemplateRequest(template._id, { sortModel, startRow, endRow, filterModel, quickFilterText }),
            );
            if (err || !data) {
                onFail?.(err);
                params.fail();
                return;
            }

            if (!isFirstDataFetched) {
                isFirstDataFetched = true;
                params.columnApi.autoSizeColumns([actionsColumnId]);
            }

            params.success({ rowData: data.rows, rowCount: data.lastRowIndex });
        },
    };
};

const getRowModelProps = <Data extends any>(
    rowModelType: 'serverSide' | 'clientSide',
    template: IMongoEntityTemplatePopulated,
    rowData: Data[] | undefined,
    datasource: IServerSideDatasource | undefined,
    quickFilterText: string | undefined,
    datasourceOnFail: ((err: unknown) => void) | undefined,
    actionsColumnId: string,
): React.ComponentProps<typeof AgGridReact> => {
    if (rowModelType === 'clientSide') {
        return { rowModelType, rowData };
    }
    return {
        rowModelType,
        serverSideDatasource: datasource ?? getDatasource(template, quickFilterText, datasourceOnFail, actionsColumnId),
        serverSideStoreType: 'partial',
        cacheBlockSize: 50,
        maxBlocksInCache: 1000,
    };
};

type EntitiesTableOfTemplateProps<Data> = {
    template: IMongoEntityTemplatePopulated;
    onRowSelected?: (data: Data) => void;
    showNavigateToRowButton: boolean;
    deleteRowButtonProps?: {
        onClick: (data: Data) => void;
        popoverText: string;
    };
    getRowId: (data: Data) => string;
    getEntityPropertiesData: (data: Data) => IEntity['properties'];
    rowModelType: 'serverSide' | 'clientSide';
    rowData?: Data[];
    datasource?: IServerSideDatasource;
    quickFilterText?: string;
    height: React.CSSProperties['height'];
    rowHeight: number;
    fontSize: React.CSSProperties['fontSize'];
    minColumnWidth: number;
};

const EntitiesTableOfTemplate = forwardRef(
    <Data extends any>(
        {
            template,
            onRowSelected,
            showNavigateToRowButton,
            deleteRowButtonProps,
            getRowId,
            getEntityPropertiesData,
            rowModelType,
            rowData,
            datasource,
            quickFilterText,
            height,
            rowHeight,
            fontSize,
            minColumnWidth,
        }: EntitiesTableOfTemplateProps<Data>,
        ref,
    ) => {
        const navigate = useNavigate();

        const gridRef = useRef<AgGridReact>(null);

        useImperativeHandle(ref, () => ({
            getExcelData() {
                return gridRef.current!.api.getSheetDataForExcel({ sheetName: template.displayName });
            },
        }));

        const actionsColumnId = 'actions';
        const columnDefs: ColDef[] = getColumnDefs(
            template,
            actionsColumnId,
            getEntityPropertiesData,
            !showNavigateToRowButton ? undefined : (data) => navigate(`/entity/${getEntityPropertiesData(data)._id}`),
            deleteRowButtonProps,
        );

        const datasourceOnFail = (err: unknown) => {
            toast.error(i18next.t('entitiesTableOfTemplate.failedToLoadData'));
            console.log('failed to load data from datasource. err:', err);
        };
        const rowModelProps = getRowModelProps(rowModelType, template, rowData, datasource, quickFilterText, datasourceOnFail, actionsColumnId);

        return (
            <Box>
                {/* maybe there's a better way to override hover color. in .css we dont need "!important" */}
                {onRowSelected && (
                    <GlobalStyles
                        styles={{
                            '.ag-theme-material .ag-row-hover': { backgroundColor: '#75b0eb !important' },
                        }}
                    />
                )}
                <AgGridReact
                    ref={gridRef}
                    className="ag-theme-material"
                    containerStyle={{
                        height,
                        width: '100%',
                        fontFamily: 'Rubik',
                        fontSize,
                        // todo: removed marginBottom: 30px. check doesnt effect regular page
                    }}
                    modules={[
                        ServerSideRowModelModule,
                        ExcelExportModule,
                        ColumnsToolPanelModule,
                        MenuModule,
                        SetFilterModule,
                        ClientSideRowModelModule,
                    ]}
                    domLayout="autoHeight"
                    getRowId={({ data }) => getRowId(data)}
                    columnDefs={columnDefs}
                    {...rowModelProps}
                    pagination
                    paginationPageSize={5}
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
                    suppressCsvExport
                    suppressContextMenu
                    onFirstDataRendered={(event) => {
                        // auto size actionsColumnId. onFirstDataRendered bug with SSRM. https://github.com/ag-grid/ag-grid/issues/2662
                        if (rowModelType === 'clientSide') {
                            event.columnApi.autoSizeColumns([actionsColumnId]);
                        }
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
    props: EntitiesTableOfTemplateProps<Data> & { ref?: React.ForwardedRef<unknown> },
) => ReturnType<typeof EntitiesTableOfTemplate>;
