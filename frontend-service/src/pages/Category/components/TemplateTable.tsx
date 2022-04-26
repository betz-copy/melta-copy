import React, { useRef, MouseEventHandler, forwardRef, useImperativeHandle, memo } from 'react';
import i18next from 'i18next';
import { Grid, Typography, IconButton } from '@mui/material';
import { AddCircle, FileDownloadOutlined, ReadMore as ReadMoreIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, IServerSideDatasource } from '@noam7700/ag-grid-enterprise';

import { getEntitiesByTemplateRequest } from '../../../services/entitiesService';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { IEntity } from '../../../interfaces/entities';
import { booleanColDef, dateColDef, numberColDef, stringColDef } from '../../../utils/agGrid/commonColDefs';
import { DateFilterComponent } from '../../../utils/agGrid/DateFilterComponent';

import 'ag-grid-community/dist/styles/ag-grid.css';
import 'ag-grid-community/dist/styles/ag-theme-material.css';
import '../../../css/components/templateTable.css';

const TemplateTable = forwardRef(
    ({ template, onAddEntity }: { template: IMongoEntityTemplatePopulated; onAddEntity: MouseEventHandler<HTMLButtonElement> }, ref) => {
        const gridRef = useRef<any>(null);
        const navigate = useNavigate();

        const handleExport: MouseEventHandler<HTMLButtonElement> = () => {
            gridRef.current.api.exportDataAsExcel({ sheetName: template.displayName, fileName: `${template.displayName}.xlsx` });
        };

        useImperativeHandle(ref, () => ({
            getExcelData() {
                return gridRef.current.api.getSheetDataForExcel({ sheetName: template.displayName });
            },
        }));

        const columnDefs: ColDef[] = Object.entries(template.properties.properties).map(([key, value]) => {
            const { type, format } = value;

            if (type === 'number') return numberColDef(key, value);
            if (type === 'boolean') return booleanColDef(key, value);
            if (format === 'date' || format === 'date-time') return dateColDef(key, value);
            return stringColDef(key, value);
        });

        const datasource: IServerSideDatasource = {
            async getRows(params) {
                const { sortModel, startRow, endRow, filterModel } = params.request;
                const data = await getEntitiesByTemplateRequest(template._id, { sortModel, startRow, endRow, filterModel });
                params.success({
                    rowData: data.rows.map((entity) => entity.properties),
                    rowCount: 100, // TODO: change row count
                });
            },
        };

        const addedColumns: ColDef[] = [
            {
                colId: 'actions',
                headerName: i18next.t('pages.entityView'),
                pinned: 'left',
                field: '_id',
                menuTabs: [],
                sortable: false,
                minWidth: 0,
                cellRenderer: memo<{ value: string }>(({ value }) => (
                    <IconButton onClick={() => navigate(`/entity/${value}`)}>
                        <ReadMoreIcon
                            style={{
                                transform: 'scaleX(-1)',
                            }}
                        />
                    </IconButton>
                )),
            },
        ];

        return (
            <Grid container>
                <Grid container paddingLeft={3} justifyContent="space-between" width="100%">
                    <Grid>
                        <Grid item>
                            <Typography variant="h6" style={{ fontWeight: '500' }}>
                                {template.displayName}
                            </Typography>
                        </Grid>
                    </Grid>
                    <Grid>
                        <Grid item>
                            <IconButton size="medium" onClick={handleExport}>
                                <FileDownloadOutlined color="primary" fontSize="medium" />
                            </IconButton>
                            <IconButton onClick={onAddEntity}>
                                <AddCircle color="primary" fontSize="large" />
                            </IconButton>
                        </Grid>
                    </Grid>
                </Grid>
                <AgGridReact
                    className="ag-theme-material"
                    containerStyle={{ height: 360, width: '100%', marginBottom: '30px', fontFamily: 'Rubik', fontSize: '16px', borderRadius: '70px' }}
                    domLayout="autoHeight"
                    ref={gridRef}
                    getRowId={({ data: entity }) => (entity as IEntity['properties'] & { _id: string })._id}
                    columnDefs={[...columnDefs, ...addedColumns]}
                    pagination
                    paginationPageSize={5}
                    rowHeight={50}
                    rowModelType="serverSide"
                    serverSideDatasource={datasource}
                    serverSideStoreType="partial"
                    components={{
                        agDateInput: DateFilterComponent,
                    }}
                    onFirstDataRendered={(params) => {
                        params.columnApi.autoSizeColumns(['actions']);
                    }}
                    columnHoverHighlight
                    enableRtl
                    enableCellTextSelection
                    suppressCellFocus
                    suppressCsvExport
                    suppressContextMenu
                    defaultColDef={{
                        filterParams: {
                            suppressAndOrCondition: true,
                            buttons: ['reset'],
                        },
                        sortable: true,
                        menuTabs: ['filterMenuTab'],
                        minWidth: 200,
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
            </Grid>
        );
    },
);

export { TemplateTable };
