import React, { useRef, MouseEventHandler } from 'react';
import i18next from 'i18next';
import { Grid, Typography, IconButton } from '@mui/material';
import { AddCircle, FileDownloadOutlined } from '@mui/icons-material';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, ValueFormatterParams } from 'ag-grid-community';
import 'ag-grid-enterprise';
import { useQuery } from 'react-query';
import { getEntitiesByTemplateRequest } from '../../../services/entitiesService';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { IEntity } from '../../../interfaces/entities';

import 'ag-grid-community/dist/styles/ag-grid.css';
import 'ag-grid-community/dist/styles/ag-theme-material.css';
import '../../../css/components/templateTable.css';

const TemplateTable: React.FC<{
    template: IMongoEntityTemplatePopulated;
}> = ({ template }) => {
    const gridRef = useRef<any>(null);

    const { data: entities } = useQuery<IEntity[]>(['getEntitiesByTemplate', template._id], () => getEntitiesByTemplateRequest(template._id), {
        placeholderData: [],
    });

    const handleExport: MouseEventHandler<HTMLButtonElement> = () => {
        gridRef.current.api.exportDataAsExcel();
    };

    const valueFormatter = (params: ValueFormatterParams) => {
        if (template.properties.properties[params.colDef.field!].type === 'boolean')
            return String(params.value) === 'true' ? i18next.t('booleanOptions.yes') : i18next.t('booleanOptions.no');
        return params.value;
    };

    const columnDefs: ColDef[] = Object.entries(template.properties.properties).map(([key, value]) => {
        const { type, format } = value;
        let filter = 'agTextColumnFilter';
        if (type === 'string' && format === 'Date') filter = 'agDateColumnFilter';
        if (type === 'number') filter = 'agNumberColumnFilter';
        if (type === 'boolean') filter = 'agSetColumnFilter';

        return {
            headerName: value.title,
            field: key,
            filter,
        };
    });

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
            <AgGridReact
                className="ag-theme-material"
                containerStyle={{ height: 360, width: '100%', marginBottom: '30px', fontFamily: 'Rubik', fontSize: '16px', borderRadius: '70px' }}
                domLayout="autoHeight"
                ref={gridRef}
                columnDefs={columnDefs}
                pagination
                paginationPageSize={5}
                rowHeight={50}
                rowData={entities?.map((entity) => entity.properties)}
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
                        valueFormatter,
                    },
                    valueFormatter,
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
};

export { TemplateTable };
