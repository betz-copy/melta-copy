import React from 'react';
import i18next from 'i18next';
import 'ag-grid-enterprise';
import { AgGridColumn, AgGridReact } from 'ag-grid-react';
import { Grid, Typography, Box, Input, IconButton } from '@mui/material';
import { SearchRounded, CloseOutlined, AddCircle, FileDownloadOutlined } from '@mui/icons-material';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';

import 'ag-grid-community/dist/styles/ag-grid.css';
import 'ag-grid-community/dist/styles/ag-theme-material.css';
import '../../../css/components/templateTable.css';
import { IEntity } from '../../../interfaces/entities';

const TemplateTable: React.FC<{
    template: IMongoEntityTemplatePopulated & { entities: IEntity[] };
    templateToDisplay: string[];
}> = ({ template, templateToDisplay }) => {
    const gridRef = React.useRef<any>(null);

    const [openInputField, setOpenInputField] = React.useState('');
    const [showInputField, setShowInputField] = React.useState(false);

    const titleNames = () => {
        const obj: { [key: string]: string } = {};
        Object.keys(template.properties.properties).forEach((name) => {
            obj[name] = template.properties.properties[name].title;
        });
        return obj;
    };

    const headerNames = titleNames();
    const handleChange = (ev: any) => {
        setOpenInputField(ev.target.value);
    };
    const handleSearched = (_ev: any) => {
        console.log(`searched ${openInputField}`);
    };
    const handleOpenInputField = (_ev: any) => {
        setShowInputField(true);
    };

    const handleCloseInputField = (_ev: any) => {
        setShowInputField(false);
        setOpenInputField('');
    };
    const rowHeight = 50 * template.entities.length + 110;

    const handleExport = (_ev: any) => {
        gridRef.current.api.exportDataAsExcel();
    };

    return templateToDisplay.includes(template.displayName) ? (
        <>
            <Grid container paddingLeft={3}>
                <Grid item xs={1.5}>
                    <Typography variant="h6" style={{ fontWeight: '500' }}>
                        {template.displayName}
                    </Typography>
                </Grid>
                <Grid item xs={2}>
                    {showInputField ? (
                        <Box style={{ display: 'flex' }}>
                            <IconButton onClick={handleCloseInputField} size="small">
                                <CloseOutlined color="primary" fontSize="inherit" />
                            </IconButton>
                            <Input size="small" autoFocus value={openInputField} onChange={handleChange} />
                            <IconButton onClick={handleSearched} size="small">
                                <SearchRounded color="primary" fontSize="inherit" />
                            </IconButton>
                        </Box>
                    ) : (
                        <IconButton onClick={handleOpenInputField} size="small">
                            <SearchRounded color="primary" fontSize="inherit" />
                        </IconButton>
                    )}
                </Grid>
                <Grid item xs={7} />
                <Grid item xs={0.5}>
                    <IconButton size="medium" onClick={handleExport} style={{ marginRight: '55px', marginTop: '8px' }}>
                        <FileDownloadOutlined color="primary" fontSize="medium" />
                    </IconButton>
                </Grid>
                <Grid item xs={0.5} />
                <Grid item xs={0.5}>
                    <IconButton>
                        <AddCircle color="primary" fontSize="large" />
                    </IconButton>
                </Grid>
            </Grid>

            <div
                className="ag-theme-material"
                style={{
                    height: rowHeight,
                    maxHeight: 700,
                    width: '100%',
                    paddingRight: 20,
                    marginBottom: '30px',
                    fontFamily: 'Rubik',
                    fontWeight: '400',
                }}
            >
                <AgGridReact
                    ref={gridRef}
                    pagination
                    paginationPageSize={10}
                    rowHeight={50}
                    rowData={template.entities.map((entity) => entity.properties)}
                    columnHoverHighlight
                    enableRtl
                    localeText={i18next.t('agGridLocaleText', { returnObjects: true })}
                >
                    {Object.keys(template.properties.properties).map((name) => {
                        const { type, format } = template.properties.properties[name];
                        let filter = 'agTextColumnFilter';
                        if (type === 'string' && format === 'Date') filter = 'agDateColumnFilter';
                        if (type === 'number') filter = 'agNumberColumnFilter';
                        return (
                            <AgGridColumn
                                field={name}
                                headerName={headerNames[name]}
                                key={name}
                                sortable
                                filter={filter}
                                minWidth={200}
                                flex={1}
                                filterParams={{ buttons: ['reset'] }}
                            />
                        );
                    })}
                </AgGridReact>
            </div>
        </>
    ) : (
        <div />
    );
};

export { TemplateTable };
