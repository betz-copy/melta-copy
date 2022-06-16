import React, { useRef, forwardRef, useImperativeHandle } from 'react';
import { Grid, IconButton, Box } from '@mui/material';
import { AddCircle, FileDownloadOutlined } from '@mui/icons-material';
import { exportMultipleSheetsAsExcel } from '@noam7700/ag-grid-enterprise-excel-export';
import { IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import { AddEntityButton } from './AddEntityButton';
import EntitiesTableOfTemplate, { EntitiesTableOfTemplateRef } from '../EntitiesTableOfTemplate';
import { BlueTitle } from '../BlueTitle';

const TemplateTable = forwardRef<
    EntitiesTableOfTemplateRef,
    {
        template: IMongoEntityTemplatePopulated;
        quickFilterText: string;
    }
>(({ template, quickFilterText }, ref) => {
    const entitiesTableRef = useRef<EntitiesTableOfTemplateRef>(null);

    const onExcelExport = () => {
        exportMultipleSheetsAsExcel({
            data: [entitiesTableRef.current!.getExcelData()!],
            fileName: `${template.displayName}.xlsx`,
        });
    };

    useImperativeHandle(ref, () => entitiesTableRef.current!);

    return (
        <Grid container>
            <Grid container paddingLeft={3} justifyContent="space-between" width="100%">
                <Grid>
                    <Grid item>
                        <BlueTitle title={template.displayName} component="h6" variant="h6" />
                    </Grid>
                </Grid>
                <Grid>
                    <Grid item>
                        <IconButton size="medium" onClick={onExcelExport}>
                            <FileDownloadOutlined color="primary" fontSize="medium" />
                        </IconButton>
                        <AddEntityButton initialStep={1} initialValues={{ template, properties: {}, attachmentsProperties: {} }}>
                            <AddCircle color="primary" fontSize="large" />
                        </AddEntityButton>
                    </Grid>
                </Grid>
            </Grid>
            <Box sx={{ marginBottom: '30px', width: '100%' }}>
                <EntitiesTableOfTemplate
                    ref={entitiesTableRef}
                    template={template}
                    showNavigateToRowButton
                    getRowId={(entity) => entity.properties._id}
                    getEntityPropertiesData={(entity) => entity.properties}
                    rowModelType="serverSide"
                    quickFilterText={quickFilterText}
                    height={360}
                    rowHeight={50}
                    fontSize="16px"
                    minColumnWidth={200}
                />
            </Box>
        </Grid>
    );
});

export { TemplateTable };
