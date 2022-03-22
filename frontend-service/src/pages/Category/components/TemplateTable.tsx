import React, { useRef, MouseEventHandler } from 'react';
import { Grid, Typography, IconButton } from '@mui/material';
import { AddCircle, FileDownloadOutlined } from '@mui/icons-material';
import { AgGridColumn, AgGridReact } from 'ag-grid-react';
import 'ag-grid-enterprise';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { IEntity } from '../../../interfaces/entities';
import { agGridLocaleText } from '../../../utils/agGridLocaleText';

import 'ag-grid-community/dist/styles/ag-grid.css';
import 'ag-grid-community/dist/styles/ag-theme-material.css';
import '../../../css/components/templateTable.css';

const TemplateTable: React.FC<{
    template: IMongoEntityTemplatePopulated;
    entities: IEntity[];
}> = ({ template, entities }) => {
    const gridRef = useRef<any>(null);
    const headerNames: { [key: string]: string } = {};

    Object.keys(template.properties.properties).forEach((name) => {
        headerNames[name] = template.properties.properties[name].title;
    });

    const handleExport: MouseEventHandler<HTMLButtonElement> = () => {
        gridRef.current.api.exportDataAsExcel();
    };

    const handleValueFormatter = (params: any) => {
        if (template.properties.properties[params.colDef.field].type === 'boolean') return params.value === false ? 'לא' : 'כן';
        return params.value;
    };

    const stringFormatter = (params: any) => {
        if (template.properties.properties[params.colDef.field].type === 'boolean') return params.value === 'false' ? 'לא' : 'כן';
        return params.value;
    };

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
                        <IconButton>
                            <AddCircle color="primary" fontSize="large" />
                        </IconButton>
                    </Grid>
                </Grid>
            </Grid>

            <div
                className="ag-theme-material"
                style={{
                    height: 610,
                    width: '100%',
                    marginBottom: '30px',
                    fontFamily: 'Rubik',
                    fontWeight: '400',
                    fontSize: '16px',
                }}
            >
                <AgGridReact
                    ref={gridRef}
                    pagination
                    paginationPageSize={10}
                    rowHeight={50}
                    rowData={entities.map((entity) => entity.properties)}
                    columnHoverHighlight
                    enableRtl
                    enableCellTextSelection
                    suppressCellSelection
                    suppressCsvExport
                    suppressContextMenu
                    defaultColDef={{
                        filterParams: {
                            suppressAndOrCondition: true,
                            buttons: ['reset'],
                        },
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
                    localeText={agGridLocaleText}
                >
                    {Object.keys(template.properties.properties).map((name) => {
                        const { type, format } = template.properties.properties[name];
                        let filter = 'agTextColumnFilter';
                        if (type === 'string' && format === 'Date') filter = 'agDateColumnFilter';
                        if (type === 'integer') filter = 'agNumberColumnFilter';
                        if (type === 'boolean') filter = 'agSetColumnFilter';
                        return (
                            <AgGridColumn
                                field={name}
                                headerName={headerNames[name]}
                                key={name}
                                sortable
                                menuTabs={['filterMenuTab']}
                                filter={filter}
                                minWidth={200}
                                flex={1}
                                valueFormatter={handleValueFormatter}
                                filterParams={{ buttons: ['reset'], valueFormatter: stringFormatter }}
                            />
                        );
                    })}
                </AgGridReact>
            </div>
        </Grid>
    );
};

export { TemplateTable };
