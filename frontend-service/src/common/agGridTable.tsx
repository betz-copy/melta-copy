import { ColDef } from '@ag-grid-community/core';
import { AgGridReact, AgGridReactProps } from '@ag-grid-community/react';
import React, { ForwardedRef, forwardRef, useImperativeHandle, useRef } from 'react';
import { useDarkModeStore } from '../stores/darkMode';
import { useWorkspaceStore } from '../stores/workspace';
import { agGridLocaleText } from '../utils/agGrid/agGridLocaleText';

export type AgGridTableProps<Data> = {
    defaultColDef: ColDef<Data>;
    columnDefs: ColDef[];
    rowModelProps: AgGridReactProps<Data>;
    getRowId: (data: Data) => string;
    quickFilterText?: string;
};

export type AgGridTableRef<Data> = {
    refreshServerSide: () => void;
    updateRowDataClientSide: (data: Data) => void;
};

const AgGridTable = forwardRef<AgGridTableRef<unknown>, AgGridTableProps<unknown>>(
    <Data,>(
        { defaultColDef, columnDefs, getRowId, rowModelProps, quickFilterText }: AgGridTableProps<Data>,
        ref: ForwardedRef<AgGridTableRef<Data>>,
    ) => {
        const darkMode = useDarkModeStore((state) => state.darkMode);
        const workspace = useWorkspaceStore((state) => state.workspace);
        const gridRef = useRef<AgGridReact<Data>>(null);
        const { defaultRowHeight, defaultFontSize } = workspace.metadata.agGrid;

        useImperativeHandle(ref, () => ({
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
        }));

        return (
            <AgGridReact<Data>
                ref={gridRef}
                className={`ag-theme-material${darkMode ? '-dark' : ''}`}
                containerStyle={{
                    height: '780px',
                    width: '100%',
                    marginBottom: '30px',
                    fontFamily: 'Rubik',
                    fontSize: `${defaultFontSize}px`,
                    borderRadius: '70px',
                }}
                defaultColDef={defaultColDef}
                columnDefs={columnDefs}
                getRowId={({ data }) => getRowId(data)}
                {...rowModelProps}
                paginationAutoPageSize
                rowHeight={defaultRowHeight}
                rowStyle={{ alignItems: 'center' }}
                enableRtl
                enableCellTextSelection
                suppressMovableColumns
                suppressCsvExport
                suppressExcelExport
                suppressContextMenu
                sideBar={{
                    toolPanels: [
                        {
                            id: 'columns',
                            labelDefault: 'Columns',
                            labelKey: 'columns',
                            iconKey: 'columns',
                            toolPanel: 'agColumnsToolPanel',
                            toolPanelParams: { suppressRowGroups: true, suppressValues: true, suppressPivotMode: true },
                        },
                    ],
                    position: 'left',
                }}
                quickFilterText={quickFilterText}
                localeText={agGridLocaleText}
                suppressRowTransform
            />
        );
    },
);

export default AgGridTable as <Data>(
    props: AgGridTableProps<Data> & { ref?: React.ForwardedRef<AgGridTableRef<Data>> },
) => ReturnType<typeof AgGridTable>;
